/**
 * viasegura-mqtt.js  — Conexión MQTT + Semáforo de riesgo de ruta
 * ViaSegura TECSUP  
 * 
 * LÓGICA DEL SEMÁFORO:
 *   🟢 VERDE   → Alumno en ruta (dentro de 50m de la ruta segura)
 *   🟡 AMARILLO → Desviado (50–150m de la ruta)
 *   🔴 ROJO    → Peligro (más de 150m fuera de ruta)
 *
 * MQTT Broker: 157.245.88.132 (mqtt-lab DigitalOcean)
 *   - TCP  puerto 1883 (ESP32)
 *   - WS   puerto 9001 (navegador web)
 * Credenciales: IotUser / LosSigmas1A
 */

(function (global) {
  'use strict';

  /* ═══════════════════════════════════════════
     CONFIGURACIÓN
  ═══════════════════════════════════════════ */
  var CFG = {
    host    : '157.245.88.132',
    wsPort  : 9001,
    user    : 'IotUser',
    pass    : 'LosSigmas1A',
    clientId: 'ViaSegura_App_' + Math.random().toString(16).substr(2, 6),
    topics  : {
      distancia : 'viasegura/distancia',
      led       : 'viasegura/led',
      estado    : 'viasegura/estado',
      emergencia: 'viasegura/emergencia',
      comando   : 'viasegura/comando',
      gps       : 'viasegura/gps'          // publica la posición del alumno
    },
    // Umbrales de distancia a la ruta (metros)
    zonaVerde   : 50,   // dentro de 50m → VERDE (seguro)
    zonaAmarillo: 150   // 50-150m → AMARILLO, >150m → ROJO
  };

  /* ═══════════════════════════════════════════
     ESTADO
  ═══════════════════════════════════════════ */
  var State = {
    client       : null,
    connected    : false,
    lastDist     : null,
    lastEstado   : null,
    lastLed      : null,
    semaforoColor: 'gris',   // 'verde' | 'amarillo' | 'rojo' | 'gris'
    gpsWatchId   : null,
    currentPos   : null,
    rutaPuntos   : []        // array de {lat, lng} de la ruta institucional
  };

  /* ═══════════════════════════════════════════
     UTILIDADES
  ═══════════════════════════════════════════ */

  /** Distancia en metros entre dos coords (Haversine) */
  function haversine(lat1, lng1, lat2, lng2) {
    var R   = 6371000;
    var dLa = (lat2 - lat1) * Math.PI / 180;
    var dLo = (lng2 - lng1) * Math.PI / 180;
    var a   = Math.sin(dLa / 2) * Math.sin(dLa / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** Distancia mínima del punto a cualquier segmento de la ruta */
  function distanciaARuta(lat, lng) {
    if (!State.rutaPuntos || State.rutaPuntos.length === 0) return 0;
    var minDist = Infinity;
    State.rutaPuntos.forEach(function (p) {
      var d = haversine(lat, lng, p.lat, p.lng);
      if (d < minDist) minDist = d;
    });
    return minDist;
  }

  /** Determina el color del semáforo según distancia a la ruta */
  function calcularSemaforo(distMetros) {
    if (distMetros <= CFG.zonaVerde)    return 'verde';
    if (distMetros <= CFG.zonaAmarillo) return 'amarillo';
    return 'rojo';
  }

  /* ═══════════════════════════════════════════
     RUTA INSTITUCIONAL (puntos clave)
     Se actualiza automáticamente desde el
     Store de ViaSegura cuando hay institución
  ═══════════════════════════════════════════ */
  function cargarRutaInstitucional() {
    try {
      // Intenta tomar la institución del Store de ViaSegura
      var store = window.ViaSeguraApp && window.ViaSeguraApp.Store;
      var inst  = store && store.institution && store.institution(store.state && store.state.selectedInstitutionId);
      if (inst && inst.lat && inst.lng) {
        // Ruta simplificada: punto de inicio (casa/posición actual) → institución
        var home = State.currentPos;
        State.rutaPuntos = [];
        if (home) State.rutaPuntos.push({ lat: home.lat, lng: home.lng });
        State.rutaPuntos.push({ lat: inst.lat, lng: inst.lng });
        // Punto intermedio generado linealmente (a 1/3 y 2/3)
        if (home) {
          State.rutaPuntos.splice(1, 0, {
            lat: home.lat + (inst.lat - home.lat) / 3,
            lng: home.lng + (inst.lng - home.lng) / 3
          });
          State.rutaPuntos.splice(2, 0, {
            lat: home.lat + 2 * (inst.lat - home.lat) / 3,
            lng: home.lng + 2 * (inst.lng - home.lng) / 3
          });
        }
      }
    } catch (e) { /* si el Store no está listo aún */ }
  }

  /* ═══════════════════════════════════════════
     SEMÁFORO UI — actualiza indicadores
  ═══════════════════════════════════════════ */
  function actualizarSemaforoUI(color, distMetros, motivo) {
    State.semaforoColor = color;

    var textos = {
      verde   : { emoji: '🟢', label: 'SEGURO', desc: 'En ruta · ' + Math.round(distMetros) + 'm' },
      amarillo: { emoji: '🟡', label: 'ALERTA',  desc: 'Desviándose · ' + Math.round(distMetros) + 'm' },
      rojo    : { emoji: '🔴', label: 'PELIGRO', desc: 'Fuera de ruta · ' + Math.round(distMetros) + 'm' },
      gris    : { emoji: '⚪', label: 'SIN DATOS', desc: motivo || 'Sin ubicación' }
    };
    var t = textos[color] || textos.gris;

    // Colores de fondo
    var fondos = { verde: '#22c55e', amarillo: '#f59e0b', rojo: '#ef4444', gris: '#6b7280' };
    var fondo  = fondos[color] || fondos.gris;

    // ── Actualizar TODOS los semáforos en la página ──
    document.querySelectorAll('[data-semaforo]').forEach(function (el) {
      el.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;background:' + fondo +
        ';color:#fff;border-radius:12px;padding:10px 14px;font-weight:700;font-size:13px;">' +
        '<span style="font-size:22px">' + t.emoji + '</span>' +
        '<div><div>' + t.label + '</div>' +
        '<div style="font-weight:400;font-size:11px;opacity:.85">' + t.desc + '</div></div>' +
        '</div>';
    });

    // ── Indicador compacto de barra topbar ──
    document.querySelectorAll('[data-semaforo-dot]').forEach(function (el) {
      el.style.background = fondo;
      el.title = t.label + ' · ' + t.desc;
    });

    // ── Panel MQTT flotante ──
    var el = document.getElementById('mqtt-semaforo-val');
    if (el) {
      el.textContent = t.emoji + ' ' + t.label;
      el.style.color = fondo;
    }
    var el2 = document.getElementById('mqtt-semaforo-desc');
    if (el2) el2.textContent = t.desc;
  }

  /* ═══════════════════════════════════════════
     GPS DEL NAVEGADOR — publica posición en MQTT
  ═══════════════════════════════════════════ */
  function iniciarGPSMQTT() {
    if (!navigator.geolocation) return;
    State.gpsWatchId = navigator.geolocation.watchPosition(function (pos) {
      State.currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      cargarRutaInstitucional();

      var dist  = distanciaARuta(State.currentPos.lat, State.currentPos.lng);
      var color = calcularSemaforo(dist);
      actualizarSemaforoUI(color, dist);

      // Publica posición GPS al VPS
      if (State.connected && State.client) {
        var payload = JSON.stringify({
          lat   : State.currentPos.lat,
          lng   : State.currentPos.lng,
          dist  : Math.round(dist),
          riesgo: color,
          ts    : Date.now()
        });
        State.client.publish(CFG.topics.gps, payload);
      }
    }, function (err) {
      actualizarSemaforoUI('gris', 0, 'GPS no disponible');
    }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
  }

  function detenerGPSMQTT() {
    if (State.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(State.gpsWatchId);
      State.gpsWatchId = null;
    }
  }

  /* ═══════════════════════════════════════════
     MQTT — CONECTAR
  ═══════════════════════════════════════════ */
  function conectar(onStatus) {
    if (typeof mqtt === 'undefined') {
      onStatus && onStatus('error', 'Librería MQTT no cargada');
      return;
    }
    var url = 'ws://' + CFG.host + ':' + CFG.wsPort + '/mqtt';
    onStatus && onStatus('conectando', 'Conectando a ' + url + '...');

    State.client = mqtt.connect(url, {
      clientId   : CFG.clientId,
      username   : CFG.user,
      password   : CFG.pass,
      keepalive  : 30,
      reconnectPeriod: 5000
    });

    State.client.on('connect', function () {
      State.connected = true;
      onStatus && onStatus('ok', '✅ Conectado al VPS · ' + CFG.host);
      // Suscribirse a todos los topics del ESP32
      State.client.subscribe('viasegura/#');
      State.client.publish(CFG.topics.estado, 'APP_ONLINE');
      iniciarGPSMQTT();
      actualizarBotonesUI(true);
    });

    State.client.on('message', function (topic, payload) {
      var msg = payload.toString();
      manejarMensaje(topic, msg);
    });

    State.client.on('error', function (err) {
      State.connected = false;
      onStatus && onStatus('error', '❌ ' + (err.message || 'Error de conexión'));
      actualizarBotonesUI(false);
    });

    State.client.on('close', function () {
      State.connected = false;
      onStatus && onStatus('desconectado', 'Desconectado');
      actualizarBotonesUI(false);
      detenerGPSMQTT();
    });

    State.client.on('reconnect', function () {
      onStatus && onStatus('conectando', '🔄 Reconectando...');
    });
  }

  function desconectar() {
    detenerGPSMQTT();
    if (State.client) { State.client.end(true); State.client = null; }
    State.connected = false;
    actualizarSemaforoUI('gris', 0, 'Sin conexión');
    actualizarBotonesUI(false);
  }

  function enviarComando(cmd) {
    if (State.connected && State.client) {
      State.client.publish(CFG.topics.comando, cmd);
    }
  }

  /* ═══════════════════════════════════════════
     MENSAJES MQTT ENTRANTES
  ═══════════════════════════════════════════ */
  function manejarMensaje(topic, msg) {
    if (topic === CFG.topics.distancia) {
      State.lastDist = parseInt(msg);
      var el = document.getElementById('mqtt-dist-val');
      if (el) el.textContent = msg + ' cm';
    }
    if (topic === CFG.topics.led) {
      State.lastLed = msg;
      var el = document.getElementById('mqtt-led-val');
      if (el) {
        el.textContent = msg;
        el.style.color = msg.includes('VERDE') ? '#22c55e' : msg.includes('ROJO') ? '#ef4444' : '#6b7280';
      }
    }
    if (topic === CFG.topics.estado) {
      State.lastEstado = msg;
      var el = document.getElementById('mqtt-estado-val');
      if (el) {
        el.textContent = msg;
        el.style.color = msg === 'EMERGENCIA' ? '#ef4444' : msg === 'ONLINE' ? '#22c55e' : '#6b7280';
      }
      // Si el ESP32 detecta alumno cerca/lejos, actualizar semáforo por sensor
      if (msg === 'ALUMNO_CERCA') {
        // No sobreescribir si tenemos GPS propio
        if (!State.currentPos) actualizarSemaforoUI('verde', 0, 'ESP32: alumno cerca');
      }
      if (msg === 'ALUMNO_LEJOS') {
        if (!State.currentPos) actualizarSemaforoUI('rojo', 999, 'ESP32: alumno lejos');
      }
    }
    if (topic === CFG.topics.emergencia) {
      var el = document.getElementById('mqtt-emerg-val');
      if (el) el.textContent = '🚨 ' + msg + ' — ' + new Date().toLocaleTimeString('es-PE');
      // Forzar semáforo ROJO durante emergencia
      actualizarSemaforoUI('rojo', 9999, '¡EMERGENCIA ACTIVADA!');
      // Notificación del navegador
      if (window.Notification && Notification.permission === 'granted') {
        new Notification('🚨 ViaSegura — EMERGENCIA', { body: msg });
      }
    }
  }

  /* ═══════════════════════════════════════════
     ACTUALIZAR BOTONES
  ═══════════════════════════════════════════ */
  function actualizarBotonesUI(conectado) {
    document.querySelectorAll('[data-mqtt-fab]').forEach(function (el) {
      el.classList.toggle('mqtt-connected', conectado);
    });
    document.querySelectorAll('[data-mqtt-btn="conectar"]').forEach(function (el) {
      el.style.display = conectado ? 'none' : '';
    });
    document.querySelectorAll('[data-mqtt-btn="desconectar"]').forEach(function (el) {
      el.style.display = conectado ? '' : 'none';
    });
    document.querySelectorAll('[data-mqtt-live]').forEach(function (el) {
      el.style.display = conectado ? '' : 'none';
    });
  }

  /* ═══════════════════════════════════════════
     PANEL MQTT HTML  (inyectado en el DOM)
  ═══════════════════════════════════════════ */
  var PANEL_CSS = `
    <style id="vs-mqtt-style">
    /* ── FAB ── */
    .vs-mqtt-fab{
      position:fixed;bottom:20px;right:16px;z-index:9999;
      background:#1a73e8;color:#fff;border:none;border-radius:50px;
      padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;
      box-shadow:0 4px 16px rgba(26,115,232,.4);
      display:flex;align-items:center;gap:8px;transition:transform .2s;
      font-family:'Segoe UI',sans-serif;
    }
    .vs-mqtt-fab:hover{transform:scale(1.04);}
    .vs-mqtt-fab .vf-dot{
      width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.4);
      transition:background .3s;
    }
    .vs-mqtt-fab.mqtt-connected .vf-dot{background:#00e676;}

    /* ── Panel ── */
    #vs-mqtt-panel{
      position:fixed;bottom:68px;right:12px;z-index:9998;
      width:300px;background:#1a1a2e;color:#e0e0e0;
      border-radius:16px;padding:16px;
      box-shadow:0 8px 32px rgba(0,0,0,.55);
      font-family:'Segoe UI',sans-serif;font-size:12px;
      display:none;flex-direction:column;gap:10px;
    }
    #vs-mqtt-panel.show{display:flex;}
    #vs-mqtt-panel h4{margin:0;font-size:14px;color:#bb86fc;}
    #vs-mqtt-panel input{
      background:#2d2d44;border:1px solid #3d3d5c;color:#e0e0e0;
      border-radius:8px;padding:7px 10px;font-size:12px;width:100%;
      box-sizing:border-box;
    }
    #vs-mqtt-panel .vp-row{display:flex;gap:8px;}
    #vs-mqtt-panel button{
      padding:8px;border:none;border-radius:8px;
      font-weight:700;cursor:pointer;font-size:12px;
    }
    #vs-mqtt-panel .vp-btn-conn{background:#1a73e8;color:#fff;flex:1;}
    #vs-mqtt-panel .vp-btn-disc{background:#cf6679;color:#fff;flex:1;display:none;}
    #vs-mqtt-panel .vp-status{
      background:#2d2d44;border-radius:8px;padding:8px 10px;
      font-size:11px;color:#81c784;min-height:28px;
    }
    /* Semáforo */
    .vs-semaforo-box{
      border-radius:12px;overflow:hidden;border:2px solid #3d3d5c;
    }
    .vs-semaforo-title{
      background:#2d2d44;padding:8px 12px;font-weight:700;font-size:12px;
      color:#bb86fc;display:flex;align-items:center;gap:6px;
    }
    .vs-semaforo-lights{
      display:flex;justify-content:center;gap:14px;
      padding:12px;background:#1e1e30;
    }
    .vs-semaforo-light{
      width:36px;height:36px;border-radius:50%;
      border:2px solid #3d3d5c;
      transition:box-shadow .4s,opacity .4s;
      opacity:.25;
    }
    .vs-semaforo-light.active{opacity:1;}
    .vs-semaforo-light.verde-light{background:#22c55e;}
    .vs-semaforo-light.amarillo-light{background:#f59e0b;}
    .vs-semaforo-light.rojo-light{background:#ef4444;}
    .vs-semaforo-light.active.rojo-light{
      box-shadow:0 0 16px 4px #ef444488;
      animation:vs-pulse-rojo 1s infinite;
    }
    .vs-semaforo-light.active.amarillo-light{
      box-shadow:0 0 12px 3px #f59e0b88;
    }
    .vs-semaforo-light.active.verde-light{
      box-shadow:0 0 12px 3px #22c55e88;
    }
    @keyframes vs-pulse-rojo{
      0%,100%{box-shadow:0 0 16px 4px #ef444488;}
      50%{box-shadow:0 0 28px 8px #ef4444cc;}
    }
    .vs-semaforo-label{
      text-align:center;padding:6px;font-size:11px;font-weight:700;
      background:#1e1e30;
    }
    /* Live data */
    [data-mqtt-live]{display:none;}
    .vl-row{display:flex;justify-content:space-between;align-items:center;
      padding:4px 0;border-bottom:1px solid #2d2d44;}
    .vl-row:last-child{border-bottom:none;}
    .vl-k{font-size:11px;color:#9e9e9e;}
    .vl-v{font-size:12px;font-weight:700;}
    /* Botón buzzer */
    .vp-btn-buzzer{background:#ff9800;color:#000;width:100%;margin-top:4px;display:none;}
    </style>
  `;

  var PANEL_HTML = `
    <!-- FAB -->
    <button class="vs-mqtt-fab" data-mqtt-fab title="Conectar con ESP32 · VPS">
      <span class="vf-dot"></span>
      📡 ESP32
    </button>

    <!-- Panel -->
    <div id="vs-mqtt-panel">
      <h4>🔗 Conectar al VPS / ESP32</h4>

      <!-- Semáforo de ruta -->
      <div class="vs-semaforo-box">
        <div class="vs-semaforo-title">🚦 Semáforo de Ruta</div>
        <div class="vs-semaforo-lights">
          <div class="vs-semaforo-light rojo-light"    id="vs-sl-rojo"></div>
          <div class="vs-semaforo-light amarillo-light" id="vs-sl-amarillo"></div>
          <div class="vs-semaforo-light verde-light"   id="vs-sl-verde"></div>
        </div>
        <div class="vs-semaforo-label" id="vs-sl-label" style="color:#9e9e9e">Sin datos GPS</div>
      </div>

      <div>
        <label style="font-size:10px;color:#9e9e9e">Host VPS</label>
        <input id="vp-host" value="157.245.88.132">
      </div>
      <div class="vp-row">
        <div style="flex:1"><label style="font-size:10px;color:#9e9e9e">Puerto WS</label>
          <input id="vp-port" value="9001" type="number"></div>
        <div style="flex:1"><label style="font-size:10px;color:#9e9e9e">Usuario</label>
          <input id="vp-user" value="IotUser"></div>
      </div>
      <input id="vp-pass" type="password" value="LosSigmas1A" placeholder="Contraseña">

      <div class="vp-row">
        <button class="vp-btn-conn" data-mqtt-btn="conectar">⚡ Conectar</button>
        <button class="vp-btn-disc" data-mqtt-btn="desconectar">✕ Desconectar</button>
      </div>
      <div class="vp-status" id="vp-status">Sin conexión</div>

      <!-- Datos en vivo -->
      <div data-mqtt-live style="background:#2d2d44;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:4px;">
        <div style="font-size:11px;font-weight:700;color:#bb86fc;margin-bottom:4px">📊 ESP32 en vivo</div>
        <div class="vl-row"><span class="vl-k">Semáforo ruta</span>
          <span class="vl-v" id="mqtt-semaforo-val" style="color:#9e9e9e">—</span></div>
        <div class="vl-row"><span class="vl-k">Distancia sensor</span>
          <span class="vl-v" id="mqtt-dist-val" style="color:#9e9e9e">—</span></div>
        <div class="vl-row"><span class="vl-k">LED ESP32</span>
          <span class="vl-v" id="mqtt-led-val" style="color:#9e9e9e">—</span></div>
        <div class="vl-row"><span class="vl-k">Estado</span>
          <span class="vl-v" id="mqtt-estado-val" style="color:#9e9e9e">—</span></div>
        <div class="vl-row"><span class="vl-k">Última emergencia</span>
          <span class="vl-v" id="mqtt-emerg-val" style="color:#ef4444">—</span></div>
        <div class="vl-row"><span class="vl-k">Desc. semáforo</span>
          <span class="vl-v" id="mqtt-semaforo-desc" style="color:#9e9e9e;font-size:10px">—</span></div>
        <button class="vp-btn-buzzer" id="vp-buzzer">🔔 Activar buzzer remoto</button>
      </div>
    </div>
  `;

  /* ═══════════════════════════════════════════
     INYECTAR PANEL EN EL DOM
  ═══════════════════════════════════════════ */
  function inyectarPanel() {
    if (document.getElementById('vs-mqtt-panel')) return; // ya existe

    // CSS
    var styleDiv = document.createElement('div');
    styleDiv.innerHTML = PANEL_CSS;
    document.head.appendChild(styleDiv.firstElementChild);

    // HTML
    var wrapper = document.createElement('div');
    wrapper.innerHTML = PANEL_HTML;
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);

    // ── Eventos del panel ──
    var fab    = document.querySelector('[data-mqtt-fab]');
    var panel  = document.getElementById('vs-mqtt-panel');
    var status = document.getElementById('vp-status');

    // Toggle panel
    fab.addEventListener('click', function () {
      panel.classList.toggle('show');
    });

    // Conectar
    document.querySelector('[data-mqtt-btn="conectar"]').addEventListener('click', function () {
      CFG.host   = document.getElementById('vp-host').value.trim() || CFG.host;
      CFG.wsPort = parseInt(document.getElementById('vp-port').value) || CFG.wsPort;
      CFG.user   = document.getElementById('vp-user').value.trim();
      CFG.pass   = document.getElementById('vp-pass').value.trim();

      conectar(function (tipo, msg) {
        status.textContent = msg;
        status.style.color =
          tipo === 'ok'       ? '#81c784' :
          tipo === 'error'    ? '#cf6679' :
          tipo === 'conectando' ? '#f9a825' : '#9e9e9e';
      });
    });

    // Desconectar
    document.querySelector('[data-mqtt-btn="desconectar"]').addEventListener('click', desconectar);

    // Buzzer
    document.getElementById('vp-buzzer').addEventListener('click', function () {
      enviarComando('BUZZER_ON');
      status.textContent = '🔔 Comando BUZZER_ON enviado';
      setTimeout(function () { status.textContent = '✅ Conectado'; }, 2000);
    });

    // Mostrar buzzer cuando conectado
    document.addEventListener('vs-mqtt-connected', function () {
      document.getElementById('vp-buzzer').style.display = 'block';
    });
  }

  /* ═══════════════════════════════════════════
     SEMÁFORO VISUAL (luces)
  ═══════════════════════════════════════════ */
  var _semaforoOriginal = actualizarSemaforoUI;
  actualizarSemaforoUI = function (color, dist, motivo) {
    _semaforoOriginal(color, dist, motivo);
    // Actualizar las 3 luces del semáforo en el panel
    ['verde', 'amarillo', 'rojo'].forEach(function (c) {
      var el = document.getElementById('vs-sl-' + c);
      if (el) el.classList.toggle('active', c === color);
    });
    var label = document.getElementById('vs-sl-label');
    if (label) {
      var textos = {
        verde   : '🟢 SEGURO — En ruta',
        amarillo: '🟡 ALERTA — Desviándose',
        rojo    : '🔴 PELIGRO — Fuera de ruta',
        gris    : '⚪ Sin datos GPS'
      };
      label.textContent  = textos[color] || textos.gris;
      label.style.color  =
        color === 'verde'    ? '#22c55e' :
        color === 'amarillo' ? '#f59e0b' :
        color === 'rojo'     ? '#ef4444' : '#9e9e9e';
    }
  };

  /* ═══════════════════════════════════════════
     INICIALIZACIÓN
  ═══════════════════════════════════════════ */
  function init() {
    inyectarPanel();
    // Pedir permiso de notificaciones
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    // Iniciar GPS aunque no esté conectado MQTT (para el semáforo local)
    iniciarGPSMQTT();
    // Escuchar actualizaciones del GPS de ViaSegura (si ya estaba corriendo)
    document.addEventListener('vs-gps-update', function (e) {
      if (e.detail) {
        State.currentPos = e.detail;
        cargarRutaInstitucional();
        var dist  = distanciaARuta(e.detail.lat, e.detail.lng);
        var color = calcularSemaforo(dist);
        actualizarSemaforoUI(color, dist);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Exportar API pública ── */
  global.VsMQTT = {
    conectar       : conectar,
    desconectar    : desconectar,
    enviarComando  : enviarComando,
    calcularSemaforo: calcularSemaforo,
    state          : State
  };

})(window);
