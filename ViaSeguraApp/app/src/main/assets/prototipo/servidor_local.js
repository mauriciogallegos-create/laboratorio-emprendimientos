// Servidor local para abrir el panel por http://localhost:8080.
// Motivo: los navegadores solo entregan getUserMedia (camara del equipo) en
// contextos seguros (https:// o http://localhost). Abriendo el archivo con
// file:// no hay camara nativa.
//
// NUEVO: endpoint /api/incident para comunicación celular → laptop en
//        tiempo real (polling cada 2 s).
//
// Uso: node servidor_local.js [puerto]
const http = require('http'), fs = require('fs'), path = require('path');
const os = require('os');
const ROOT = __dirname;
const PORT = parseInt(process.argv[2] || '8080', 10);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8'
};

// ---------- Cola de incidencias en memoria ----------
var incidentQueue = [];   // incidentes pendientes de ser leídos por el panel
var incidentLog = [];     // historial completo (por si se quiere ver)

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

http.createServer(function (req, res) {
  try {
    // ---------- CORS preflight ----------
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders());
      return res.end();
    }

    var urlPath = decodeURIComponent(req.url.split('?')[0]);

    // ===== API: recibir incidencia desde el celular (POST) =====
    if (urlPath === '/api/incident' && req.method === 'POST') {
      var body = '';
      req.on('data', function (chunk) { body += chunk; });
      req.on('end', function () {
        try {
          var data = JSON.parse(body);
          data._ts = Date.now();
          data._id = 'INC-' + Date.now();
          incidentQueue.push(data);
          incidentLog.push(data);
          console.log('[INCIDENCIA RECIBIDA]', data._id, data.categoria || data.type);
          var headers = corsHeaders();
          headers['Content-Type'] = 'application/json; charset=utf-8';
          res.writeHead(200, headers);
          res.end(JSON.stringify({ ok: true, id: data._id }));
        } catch (e) {
          var headers = corsHeaders();
          headers['Content-Type'] = 'application/json; charset=utf-8';
          res.writeHead(400, headers);
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // ===== API: el panel pide incidencias nuevas (GET) =====
    if (urlPath === '/api/incident' && req.method === 'GET') {
      var pending = incidentQueue.splice(0);  // vacía y devuelve la cola
      var headers = corsHeaders();
      headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['Cache-Control'] = 'no-store';
      res.writeHead(200, headers);
      res.end(JSON.stringify({ incidents: pending, total: incidentLog.length }));
      return;
    }

    // ===== API: historial completo (GET) =====
    if (urlPath === '/api/incidents/all' && req.method === 'GET') {
      var headers = corsHeaders();
      headers['Content-Type'] = 'application/json; charset=utf-8';
      headers['Cache-Control'] = 'no-store';
      res.writeHead(200, headers);
      res.end(JSON.stringify({ incidents: incidentLog }));
      return;
    }

    // ===== Archivos estáticos =====
    var file = path.normalize(path.join(ROOT, urlPath === '/' ? '/index.html' : urlPath));
    if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end('403'); }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { file = path.join(ROOT, 'index.html'); }
    var ext = path.extname(file).toLowerCase();
    var staticHeaders = corsHeaders();
    staticHeaders['Content-Type'] = MIME[ext] || 'application/octet-stream';
    staticHeaders['Cache-Control'] = 'no-store';
    res.writeHead(200, staticHeaders);
    fs.createReadStream(file).pipe(res);
  } catch (e) { res.writeHead(500); res.end('500'); }
}).listen(PORT, '0.0.0.0', function () {
  // Mostrar las IPs de la red local para que el celular se conecte
  var ips = [];
  var ifaces = os.networkInterfaces();
  for (var name in ifaces) {
    (ifaces[name] || []).forEach(function (iface) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    });
  }
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           VíaSegura — Servidor Local Activo                 ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║                                                              ║');
  console.log('║  LAPTOP (Panel Web):                                         ║');
  console.log('║    http://localhost:' + PORT + '/web.html');
  console.log('║                                                              ║');
  if (ips.length > 0) {
    console.log('║  CELULAR (App Android):                                      ║');
    ips.forEach(function (ip) {
      console.log('║    http://' + ip + ':' + PORT + '/android.html');
    });
    console.log('║                                                              ║');
  }
  console.log('║  Ctrl+C para cerrar                                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});
