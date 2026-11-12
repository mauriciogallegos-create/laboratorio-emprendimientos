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
#include <PubSubClient.h>

// ─────────────────────────────────────────────
//  ★ EDITA ESTOS VALORES ★
// ─────────────────────────────────────────────
const char* ssid        = "Comunidad Innovadores";
const char* password    = "INn0V4-2K23!*";
const char* mqtt_server = "157.245.88.132";   // Tu VPS DigitalOcean
const int   mqtt_port   = 1883;
const char* mqtt_user   = "IotUser";           // Usuario Mosquitto VPS
const char* mqtt_pass   = "LosSigmas1A";       // Contraseña Mosquitto VPS
const char* mqtt_client = "ESP32_ViaSegura";

// Topics MQTT
const char* TOP_EMERGENCIA = "viasegura/emergencia";
const char* TOP_DISTANCIA  = "viasegura/distancia";
const char* TOP_ESTADO     = "viasegura/estado";
const char* TOP_COMANDO    = "viasegura/comando";
const char* TOP_LED        = "viasegura/led";   // Publica el estado del LED

// ─────────────────────────────────────────────
//  PINES
// ─────────────────────────────────────────────
const int pinTrig     = 5;
const int pinEcho     = 18;
const int pinBoton    = 4;
const int pinBuzzer   = 15;
const int pinLedVerde = 12;
const int pinLedRojo  = 13;

// ─────────────────────────────────────────────
//  UMBRALES DE DISTANCIA
// ─────────────────────────────────────────────
const int DIST_CERCA  = 100;   // cm → LED VERDE (alumno dentro de 1m)
const int DIST_LEJOS  = 200;   // cm → LED ROJO  (alumno se alejó a +2m)

// ─────────────────────────────────────────────
//  OBJETOS
// ─────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);
WiFiClient        espClient;
PubSubClient      mqttClient(espClient);

// ─────────────────────────────────────────────
//  VARIABLES DE ESTADO
// ─────────────────────────────────────────────
bool wifiOK  = false;
bool mqttOK  = false;

// Estado del objeto detectado
enum EstadoObj { SIN_OBJETO, CERCA, LEJOS };
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
  pinMode(pinTrig,     OUTPUT);
  pinMode(pinEcho,     INPUT);
  pinMode(pinBoton,    INPUT_PULLUP);
  pinMode(pinBuzzer,   OUTPUT);
  pinMode(pinLedVerde, OUTPUT);
  pinMode(pinLedRojo,  OUTPUT);

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
//  DETERMINAR ESTADO DEL ALUMNO
// ─────────────────────────────────────────────
void determinarEstado(long dist) {
  estadoAnterior = estadoActual;

  if (dist <= 0 || dist > 400) {
    // Sin lectura válida o muy lejos → sin objeto
    estadoActual = SIN_OBJETO;
  } else if (dist <= DIST_CERCA) {
    // Dentro de 1 metro → CERCA (verde)
    estadoActual = CERCA;
  } else if (dist > DIST_LEJOS) {
    // Más de 2 metros → LEJOS (rojo, se alejó)
    estadoActual = LEJOS;
  }
  // Entre 1-2 metros: mantiene estado anterior (zona de transición, evita parpadeo)

  // Si cambió de estado, avisar por MQTT
  if (estadoActual != estadoAnterior && mqttClient.connected()) {
    if (estadoActual == CERCA) {
      mqttClient.publish(TOP_LED, "VERDE_ON");
      mqttClient.publish(TOP_ESTADO, "ALUMNO_CERCA");
      Serial.println("[LED] VERDE → Alumno dentro de 1m");
    } else if (estadoActual == LEJOS) {
      mqttClient.publish(TOP_LED, "ROJO_PARPADEO");
      mqttClient.publish(TOP_ESTADO, "ALUMNO_LEJOS");
      Serial.println("[LED] ROJO → Alumno se alejó más de 2m");
    } else {
      mqttClient.publish(TOP_LED, "APAGADO");
      mqttClient.publish(TOP_ESTADO, "SIN_OBJETO");
    }
  }
}

// ─────────────────────────────────────────────
//  ACTUALIZAR LEDs (con efecto parpadeo en rojo)
// ─────────────────────────────────────────────
void actualizarLEDs(unsigned long ahora) {
  switch (estadoActual) {

    case CERCA:
      // LED verde fijo, rojo apagado
      digitalWrite(pinLedVerde, HIGH);
      digitalWrite(pinLedRojo,  LOW);
      break;

    case LEJOS:
      // LED verde apagado, rojo PARPADEA (cada 300ms)
      digitalWrite(pinLedVerde, LOW);
      ledRojoState = (ahora / 300) % 2 == 0;  // Alterna cada 300ms
      digitalWrite(pinLedRojo, ledRojoState ? HIGH : LOW);
      break;

    case SIN_OBJETO:
    default:
      // Ambos apagados
      digitalWrite(pinLedVerde, LOW);
      digitalWrite(pinLedRojo,  LOW);
      break;
  }
}

// ─────────────────────────────────────────────
//  LCD
// ─────────────────────────────────────────────
void actualizarLCD(long dist) {
  // Línea 0: estado de conexión
  lcd.setCursor(0, 0);
  if (!wifiOK) {
    lcd.print("SIN WiFi        ");
  } else if (!mqttOK) {
    lcd.print("SIN VPS/MQTT    ");
  } else {
    lcd.print("ZONA ESCOLAR OK ");
  }

  // Línea 1: estado del alumno
  lcd.setCursor(0, 1);
  switch (estadoActual) {
    case CERCA:
      lcd.print("ALUMNO <1m  ");
      lcd.print(dist);
      lcd.print("cm  ");
      break;
    case LEJOS:
      lcd.print("!LEJOS >2m  ");
      lcd.print(dist);
      lcd.print("cm  ");
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

  // Buzzer 6 veces
  for (int i = 0; i < 6; i++) {
    digitalWrite(pinBuzzer, HIGH); delay(150);
    digitalWrite(pinBuzzer, LOW);  delay(150);
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
        digitalWrite(pinBuzzer, HIGH); delay(200);
        digitalWrite(pinBuzzer, LOW);  delay(200);
      }
    } else if (msg == "LED_ROJO") {
      digitalWrite(pinLedRojo, HIGH); delay(3000); digitalWrite(pinLedRojo, LOW);
    } else if (msg == "RESET") {
      ESP.restart();
    }
  }
}

// ─────────────────────────────────────────────
//  CONEXIÓN WiFi
// ─────────────────────────────────────────────
void conectarWiFi() {
  mostrarMensaje("Conectando WiFi", ssid);
  WiFi.begin(ssid, password);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500); Serial.print("."); intentos++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    wifiOK = true;
    Serial.printf("\n[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());
    mostrarMensaje("WiFi OK", WiFi.localIP().toString().c_str());
    delay(800);
  } else {
    Serial.println("\n[WiFi] Error");
    mostrarMensaje("WiFi FALLO", "Sin internet");
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
  // Ambos ON por 500ms, luego apagados
  digitalWrite(pinLedVerde, HIGH);
  digitalWrite(pinLedRojo,  HIGH);
  delay(500);
  digitalWrite(pinLedVerde, LOW);
  digitalWrite(pinLedRojo,  LOW);
  delay(300);
}
