// ============================================================
//  VIA SEGURA TECSUP — ESP32 + MQTT v2
//  NUEVA LÓGICA DE LEDs:
//    • Objeto detectado < 100 cm (1 metro)  → LED VERDE ON
//    • Objeto sale a > 200 cm (2 metros)    → LED ROJO (alejamiento)
//    • Sin objeto / distancia = 0            → ambos OFF
// ============================================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <PubSubClient.h>

// ─────────────────────────────────────────────
//  ★ CONFIGURACIÓN DE REDES Y BROKER ★
// ─────────────────────────────────────────────
// Red 1 (Zona portátil de tu celular)
const char* ssid1     = "HONOR X7d 5G";
const char* pass1     = "Mauricio10";

// Red 2 (Universidad / Tecsup)
const char* ssid2     = "Comunidad Innovadores";
const char* pass2     = "INn0V4-2K23!*";

const char* mqtt_server = "viasegura-mauricio.xyz"; // Tu dominio VPS
const int   mqtt_port   = 1883;
const char* mqtt_user   = "iotuser";          // Usuario Mosquitto (minúsculas)
const char* mqtt_pass   = "LosSigmas1A";      // Contraseña Mosquitto
const char* mqtt_client = "ESP32_ViaSegura_Lab";

// Topics MQTT
const char* TOP_EMERGENCIA = "viasegura/emergencia";
const char* TOP_DISTANCIA  = "viasegura/distancia";
const char* TOP_ESTADO     = "viasegura/estado";
const char* TOP_COMANDO    = "viasegura/comando";
const char* TOP_LED        = "viasegura/led";

// ─────────────────────────────────────────────
//  PINES FÍSICOS
// ─────────────────────────────────────────────
const int pinTrig        = 5;
const int pinEcho        = 18;
const int pinBoton       = 4;
const int pinBuzzer      = 15;
const int pinLedVerde    = 12; // 🟢 Seguro / En ruta (< 100 cm)
const int pinLedAmarillo = 14; // 🟡 Precaución / Desviado (100 - 200 cm)
const int pinLedRojo     = 13; // 🔴 Peligro / Fuera de ruta (> 200 cm)

// ─────────────────────────────────────────────
//  UMBRALES DE DISTANCIA
// ─────────────────────────────────────────────
const int DIST_CERCA  = 100;   // cm → 🟢 VERDE (en ruta)
const int DIST_LEJOS  = 200;   // cm → 🟡 AMARILLO (desviándose) y >200cm → 🔴 ROJO

// ─────────────────────────────────────────────
//  OBJETOS
// ─────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiMulti         wifiMulti;
WiFiClient        espClient;
PubSubClient      mqttClient(espClient);

// ─────────────────────────────────────────────
//  VARIABLES DE ESTADO
// ─────────────────────────────────────────────
bool wifiOK  = false;
bool mqttOK  = false;

// Estado del semáforo
enum EstadoObj { SIN_OBJETO, EN_RUTA, DESVIADO, PELIGRO };
EstadoObj estadoActual   = SIN_OBJETO;
EstadoObj estadoAnterior = SIN_OBJETO;

// Tiempos
unsigned long tUltimoEnvio  = 0;
unsigned long tUltimoLED    = 0;
const long    INTERVALO_ENV = 2000;  // Enviar distancia cada 2 s
const long    INTERVALO_LED = 100;   // Actualizar LED cada 100 ms

// Para efecto de parpadeo del LED rojo cuando el alumno se aleja
bool ledRojoState = false;

// ─────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // LCD
  lcd.init();
  lcd.backlight();
  mostrarMensaje("VIA SEGURA", "TECSUP v2");
  delay(1500);

  // Pines
  pinMode(pinTrig,        OUTPUT);
  pinMode(pinEcho,        INPUT);
  pinMode(pinBoton,       INPUT_PULLUP);
  pinMode(pinBuzzer,      OUTPUT);
  pinMode(pinLedVerde,    OUTPUT);
  pinMode(pinLedAmarillo, OUTPUT);
  pinMode(pinLedRojo,     OUTPUT);

  // Test visual de LEDs al iniciar
  testLEDs();

  // WiFi + MQTT
  conectarWiFi();
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(callbackMQTT);
  conectarMQTT();

  lcd.clear();
}

// ─────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────
void loop() {
  // Mantener conexiones vivas
  if (WiFi.status() != WL_CONNECTED) {
    wifiOK = false;
    conectarWiFi();
  }
  if (!mqttClient.connected()) {
    mqttOK = false;
    conectarMQTT();
  }
  mqttClient.loop();

  // ── Botón emergencia ──
  if (digitalRead(pinBoton) == LOW) {
    activarEmergencia();
    return;
  }

  // ── Medir distancia ──
  long dist = medirDistancia();

  // ── Determinar estado por distancia ──
  determinarEstado(dist);

  // ── Actualizar LEDs con efecto ──
  unsigned long ahora = millis();
  if (ahora - tUltimoLED >= INTERVALO_LED) {
    tUltimoLED = ahora;
    actualizarLEDs(ahora);
  }

  // ── Pantalla LCD ──
  actualizarLCD(dist);

  // ── Publicar por MQTT cada 2 s ──
  if (ahora - tUltimoEnvio >= INTERVALO_ENV) {
    tUltimoEnvio = ahora;
    publicarDatos(dist);
  }

  delay(100);
}

// ─────────────────────────────────────────────
//  DETERMINAR ESTADO DEL SEMÁFORO
// ─────────────────────────────────────────────
void determinarEstado(long dist) {
  estadoAnterior = estadoActual;

  if (dist <= 0 || dist > 400) {
    estadoActual = SIN_OBJETO;
  } else if (dist <= DIST_CERCA) {
    // Menos de 1 metro → 🟢 EN RUTA (Seguro)
    estadoActual = EN_RUTA;
  } else if (dist > DIST_CERCA && dist <= DIST_LEJOS) {
    // Entre 1 y 2 metros → 🟡 DESVIADO (Precaución)
    estadoActual = DESVIADO;
  } else {
    // Más de 2 metros → 🔴 PELIGRO (Fuera de ruta)
    estadoActual = PELIGRO;
  }

  // Si cambió de estado, avisar por MQTT
  if (estadoActual != estadoAnterior && mqttClient.connected()) {
    if (estadoActual == EN_RUTA) {
      mqttClient.publish(TOP_LED, "VERDE_SEGURO");
      mqttClient.publish(TOP_ESTADO, "EN_RUTA");
      Serial.println("[SEMÁFORO] 🟢 VERDE → En ruta segura (<1m)");
    } else if (estadoActual == DESVIADO) {
      mqttClient.publish(TOP_LED, "AMARILLO_ALERTA");
      mqttClient.publish(TOP_ESTADO, "DESVIADO");
      Serial.println("[SEMÁFORO] 🟡 AMARILLO → Desviándose (1m - 2m)");
    } else if (estadoActual == PELIGRO) {
      mqttClient.publish(TOP_LED, "ROJO_PELIGRO");
      mqttClient.publish(TOP_ESTADO, "PELIGRO");
      Serial.println("[SEMÁFORO] 🔴 ROJO → Fuera de ruta (>2m)");
    } else {
      mqttClient.publish(TOP_LED, "APAGADO");
      mqttClient.publish(TOP_ESTADO, "SIN_OBJETO");
    }
  }
}

// ─────────────────────────────────────────────
//  ACTUALIZAR 3 LEDs FÍSICOS (Semáforo 🟢 🟡 🔴)
// ─────────────────────────────────────────────
void actualizarLEDs(unsigned long ahora) {
  switch (estadoActual) {

    case EN_RUTA:
      // 🟢 Verde ON, otros OFF
      digitalWrite(pinLedVerde,    HIGH);
      digitalWrite(pinLedAmarillo, LOW);
      digitalWrite(pinLedRojo,     LOW);
      break;

    case DESVIADO:
      // 🟡 Amarillo ON, otros OFF
      digitalWrite(pinLedVerde,    LOW);
      digitalWrite(pinLedAmarillo, HIGH);
      digitalWrite(pinLedRojo,     LOW);
      break;

    case PELIGRO:
      // 🔴 Rojo PARPADEA (cada 250ms), otros OFF
      digitalWrite(pinLedVerde,    LOW);
      digitalWrite(pinLedAmarillo, LOW);
      ledRojoState = (ahora / 250) % 2 == 0;
      digitalWrite(pinLedRojo, ledRojoState ? HIGH : LOW);
      break;

    case SIN_OBJETO:
    default:
      digitalWrite(pinLedVerde,    LOW);
      digitalWrite(pinLedAmarillo, LOW);
      digitalWrite(pinLedRojo,     LOW);
      break;
  }
}

// ─────────────────────────────────────────────
//  LCD
// ─────────────────────────────────────────────
void actualizarLCD(long dist) {
  lcd.setCursor(0, 0);
  if (!wifiOK) {
    lcd.print("BUSCANDO WiFi...");
  } else if (!mqttOK) {
    lcd.print("SIN CONEXION VPS");
  } else {
    lcd.print("VIA SEGURA TECSUP");
  }

  lcd.setCursor(0, 1);
  switch (estadoActual) {
    case EN_RUTA:
      lcd.print("SEGURO: ");
      lcd.print(dist);
      lcd.print("cm   ");
      break;
    case DESVIADO:
      lcd.print("ALERTA: ");
      lcd.print(dist);
      lcd.print("cm   ");
      break;
    case PELIGRO:
      lcd.print("!PELIGRO: ");
      lcd.print(dist);
      lcd.print("cm ");
      break;
    case SIN_OBJETO:
    default:
      lcd.print("CRUCE LIBRE     ");
      break;
  }
}

// ─────────────────────────────────────────────
//  PUBLICAR DATOS POR MQTT
// ─────────────────────────────────────────────
void publicarDatos(long dist) {
  if (!mqttOK) return;

  char buf[32];
  snprintf(buf, sizeof(buf), "%ld", dist);
  mqttClient.publish(TOP_DISTANCIA, buf);
  Serial.printf("[MQTT] Distancia: %s cm\n", buf);
}

// ─────────────────────────────────────────────
//  EMERGENCIA
// ─────────────────────────────────────────────
void activarEmergencia() {
  mostrarMensaje("! EMERGENCIA !", "ENVIANDO ALERTA");
  digitalWrite(pinLedVerde, LOW);
  digitalWrite(pinLedRojo,  HIGH);

  if (mqttClient.connected()) {
    mqttClient.publish(TOP_EMERGENCIA, "ALERTA_ACTIVADA");
    mqttClient.publish(TOP_ESTADO,     "EMERGENCIA");
    Serial.println("[MQTT] ¡EMERGENCIA enviada al VPS!");
  } else {
    Serial.println("ALERTA_EMERGENCIA_ACTIVADA");
  }

  // Alarma sonora potente con modulación de frecuencia (2500 Hz)
  for (int i = 0; i < 6; i++) {
    tone(pinBuzzer, 2500, 180); // Frecuencia de máxima resonancia
    delay(200);
    noTone(pinBuzzer);
    delay(100);
  }

  digitalWrite(pinLedRojo,  LOW);
  if (mqttClient.connected()) mqttClient.publish(TOP_ESTADO, "ONLINE");
  lcd.clear();
}

// ─────────────────────────────────────────────
//  MEDIR DISTANCIA HC-SR04
// ─────────────────────────────────────────────
long medirDistancia() {
  digitalWrite(pinTrig, LOW);
  delayMicroseconds(2);
  digitalWrite(pinTrig, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinTrig, LOW);

  long dur  = pulseIn(pinEcho, HIGH, 30000); // timeout 30ms (~5m)
  long dist = dur * 0.034 / 2;
  return dist;
}

// ─────────────────────────────────────────────
//  CALLBACK MQTT (recibe comandos del VPS)
// ─────────────────────────────────────────────
void callbackMQTT(char* topic, byte* payload, unsigned int len) {
  String msg = "";
  for (unsigned int i = 0; i < len; i++) msg += (char)payload[i];
  Serial.printf("[MQTT] Recibido [%s]: %s\n", topic, msg.c_str());

  if (String(topic) == TOP_COMANDO) {
    if (msg == "BUZZER_ON") {
      for (int i = 0; i < 3; i++) {
        tone(pinBuzzer, 2500, 200);
        delay(250);
        noTone(pinBuzzer);
        delay(100);
      }
    } else if (msg == "LED_ROJO") {
      digitalWrite(pinLedRojo, HIGH); delay(3000); digitalWrite(pinLedRojo, LOW);
    } else if (msg == "RESET") {
      ESP.restart();
    }
  }
}

// ─────────────────────────────────────────────
//  CONEXIÓN WiFi (Soporta 2 Redes: Celular y Tecsup)
// ─────────────────────────────────────────────
void conectarWiFi() {
  mostrarMensaje("Buscando WiFi...", "Conectando");
  Serial.println("[WiFi] Buscando redes configuradas...");

  // Registrar ambas redes
  wifiMulti.addAP(ssid1, pass1); // HONOR X7d 5G
  wifiMulti.addAP(ssid2, pass2); // Comunidad Innovadores

  int intentos = 0;
  while (wifiMulti.run() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiOK = true;
    Serial.printf("\n[WiFi] ¡Conectado a %s!\n", WiFi.SSID().c_str());
    Serial.printf("[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());
    mostrarMensaje("WiFi OK", WiFi.SSID().c_str());
    delay(1000);
  } else {
    Serial.println("\n[WiFi] No se pudo conectar a ninguna red");
    mostrarMensaje("WiFi FALLO", "Sin señal");
    delay(1500);
  }
}

// ─────────────────────────────────────────────
//  CONEXIÓN MQTT
// ─────────────────────────────────────────────
void conectarMQTT() {
  if (!wifiOK) return;
  mostrarMensaje("Conectando VPS", mqtt_server);
  int intentos = 0;
  while (!mqttClient.connected() && intentos < 5) {
    bool ok = strlen(mqtt_user) > 0
      ? mqttClient.connect(mqtt_client, mqtt_user, mqtt_pass)
      : mqttClient.connect(mqtt_client);
    if (ok) {
      mqttOK = true;
      mqttClient.subscribe(TOP_COMANDO);
      mqttClient.publish(TOP_ESTADO, "ONLINE");
      mostrarMensaje("VPS Conectado", mqtt_server);
      Serial.println("[MQTT] ¡Conectado al VPS!");
      delay(800);
    } else {
      Serial.printf("[MQTT] Error %d\n", mqttClient.state());
      intentos++; delay(2000);
    }
  }
}

// ─────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────
void mostrarMensaje(const char* l1, const char* l2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
}

void testLEDs() {
  // Encender los 3 LEDs (Verde, Amarillo, Rojo) por 600ms para probar el semáforo al arrancar
  digitalWrite(pinLedVerde,    HIGH);
  digitalWrite(pinLedAmarillo, HIGH);
  digitalWrite(pinLedRojo,     HIGH);
  delay(600);
  digitalWrite(pinLedVerde,    LOW);
  digitalWrite(pinLedAmarillo, LOW);
  digitalWrite(pinLedRojo,     LOW);
  delay(300);
}
