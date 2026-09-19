# VíaSegura — Especificación de Diseño v1

> Documento maestro para construir el prototipo en Figma.
> **Estilo:** Corporativo / Institucional. **Plataformas:** Android (Kotlin) + Panel Web (React + Vite).
> **Backend:** Firebase (Auth, Firestore, Cloud Messaging, Storage).

---

## 1. Identidad visual

### 1.1 Marca

| Elemento | Valor |
|---|---|
| Nombre | **VíaSegura** |
| Slogan | "Acompañando cada paso" |
| Símbolo sugerido (luego se afina) | Escudo redondeado + ruta punteada + pin de ubicación |
| Tono de marca | Instituto, confianza, protección, cercanía |

### 1.2 Paleta de color

El azul marino representa confianza institucional; el verde se reserva exclusivamente para estados de seguridad (recorrido normal); ámbar para advertencias; rojo para emergencias.

| Token | Color | Hex | Uso |
|---|---|---|---|
| `--color-primary` | Azul marino | `#0F2A4A` | Barra superior, títulos, botones primarios |
| `--color-primary-soft` | Azul medio | `#1B4E9B` | Hover, enlaces, iconos |
| `--color-primary-light` | Azul claro | `#3E7CB1` | Detalles, fondos de acentos |
| `--color-success` | Verde seguro | `#2E7D32` | **Solo** estados "Normal / Seguro" |
| `--color-warning` | Ámbar | `#F9A825` | Advertencias, anomalías, tiempo inusual |
| `--color-danger` | Rojo | `#C62828` | Emergencias, botón de pánico |
| `--color-bg` | Gris claro | `#EEF1F5` | Fondo general |
| `--color-surface` | Blanco | `#FFFFFF` | Tarjetas, modales |
| `--color-text` | Grafito | `#1C2836` | Texto principal |
| `--color-text-muted` | Gris | `#8A94A6` | Texto secundario, placeholders |
| `--color-border` | Gris borde | `#DDE3EA` | Divisiones, bordes de inputs |

**Regla de semántica de color (crítica):**
- 🟢 Verde = seguro / normal. Usar con moderación para no devaluarlo.
- 🟡 Ámbar = anomalía / espera tu confirmación.
- 🔴 Rojo = emergencia / peligro. Solo en botón de emergencia, alertas y KPI críticos.

### 1.3 Tipografía

| Rol | Familia | Pesos | Tamaño (sp) |
|---|---|---|---|
| App Android | **Roboto** (nativa Android) | Regular 400, Medium 500, Bold 700 | ver tabla |
| Panel Web | **Inter** (Google Fonts) | 400, 500, 600, 700 | ver tabla |

**Escala tipográfica Android:**

| Token | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 28sp | Bold | Saludo (ej. "Hola, Juan") |
| Título 1 | 22sp | Bold | Títulos de pantalla |
| Título 2 | 18sp | Medium | Nombres de sección |
| Cuerpo | 14sp | Regular | Texto general |
| Cuerpo 2 | 12sp | Regular | Detalles, metadatos |
| Etiqueta | 11sp | Medium | Labels, chips, badges |
| Botón | 14sp | Bold | Texto de botones |

**Escala tipográfica Web:**

| Token | Tamaño | Peso | Uso |
|---|---|---|---|
| Hero | 32px | Bold | Título dashboard |
| H2 | 24px | Bold | Títulos de sección |
| H3 | 18px | Semi Bold | Cards |
| Cuerpo | 14px | Regular | Texto general |
| Small | 12px | Medium | Metadatos, KPIs |
| Número KPI | 28–34px | Bold | Cifras del panel |

### 1.4 Forma y geometría

| Token | Valor |
|---|---|
| Radio de tarjetas `--radius-card` | 12px |
| Radio de botones `--radius-btn` | 8px |
| Radio de inputs `--radius-input` | 8px |
| Radio de chips `--radius-chip` | 999px (pill) |
| Espaciado base | 4px (multiplicador) |
| Sombra de tarjeta | `0 1px 3px rgba(15,42,74,.12)` |
| Sombra elevada | `0 4px 12px rgba(15,42,74,.18)` |

### 1.5 Iconografía

- Material Icons (estilo **Outlined**) para Android — tamaño base 24dp.
- Iconos redondos de 24dp para la web con relleno suave.
- Glyph emoji permitido **solo en etapas tempranas** internas; para la entrega final usar iconos.

---

## 2. Biblioteca de componentes (Design System)

### 2.1 Botones

| Variante | Fondo | Texto | Uso |
|---|---|---|---|
| `btn-primary` | Azul marino | Blanco | Acción principal |
| `btn-success` | Verde | Blanco | "Iniciar recorrido", "Confirmar" |
| `btn-danger` | Rojo | Blanco | Emergencia |
| `btn-outline` | Transparente | Azul | Acción secundaria |
| `btn-ghost` | Transparente | Azul | Enlace de acción |
| `btn-block` | — | — | Ancho completo, altura 48dp |

Estados: `default`, `hover`, `pressed`, `disabled` (opacidad 40%).

### 2.2 Botón de emergencia

- Círculo de **88dp**, rojo `#C62828`, icono campana/sirena en blanco.
- Debe estar SIEMPRE en la pantalla principal del estudiante.
- Flujo: tocar → modal "¿Deseas enviar una alerta?" → CANCELAR / CONFIRMAR → pantalla "ALERTA ENVIADA" con check.

### 2.3 Tarjetas

- Fondo blanco, radio 12px, sombra sutil.
- Header opcional con título + acción "ver todo".
- Iconos en contenedor cuadrado de 40dp con fondo por estado.

### 2.4 Inputs

- Label 12sp medium, input 48dp alto, borde 1px `--color-border`, focus borde azul.
- Estados: default, focus, error (borde rojo + mensaje), disabled.

### 2.5 Chips / Badges

- `chip-success` verde claro → texto verde
- `chip-warning` ámbar claro → texto ámbar oscuro
- `chip-danger` rojo claro → texto rojo oscuro
- `chip-neutral` gris → texto gris

### 2.6 Barra de navegación inferior (Android)

- 4 ítems máx: **Inicio**, **Ruta**, **Puntos seguros**, **Perfil**.
- Ícono + etiqueta 11sp. Estado activo con color primario.

### 2.7 Top bar

- Fondo azul marino, título blanco 18sp Bold, icono de perfil a la derecha.
- Altura 56dp.

### 2.8 Notificaciones push (patrón)

```
[Título, bold 14sp]
Descripción, 12sp
Timestamps relativos: "hace 2 min"
Fondo gris claro al entrante
```

---

## 3. Pantallas — Aplicación Android (Estudiante)

> Estructura de navegación base: `Splash → Rol → Login/Registro → Home`.

### 3.1 Splash / Onboarding

**Objetivo:** primera impresión de la marca.

- Logotipo VíaSegura centrado sobre fondo azul marino degradado.
- Tagline debajo: "Acompañando cada paso".
- 2–3 segundos → navega a selección de rol.

### 3.2 Selección de rol

- Botón card grande **Soy Estudiante** con ícono de mochila.
- Botón card grande **Soy Apoderado** con ícono de usuario/familia.
- Footer: "¿Eres institución? Ingresa al Panel Web" (enlace).

### 3.3 Login

- Email + Contraseña.
- Botón "Ingresar" (primario).
- Enlace "¿Olvidaste tu contraseña?".
- Enlace "¿No tienes cuenta? Regístrate".

### 3.4 Registro — Paso 1: Seleccionar institución

- Título + subtítulo explicativo.
- Campo de búsqueda ("Buscar tu institución").
- Lista de instituciones con ícono de escudo y nombre.
- Botón "Continuar" (deshabilitado hasta seleccionar).
- Stepper de pasos (1 de 4) arriba.

### 3.5 Registro — Paso 2: Escanear QR de institución

- Vista de cámara con marco de encuadre centrado.
- Texto "Apunta el código QR de tu institución".
- Botón "Usar foto de la galería" (alternativa).
- Cuando detecta → animación de éxito + avanza.
- Nota informativa: "El QR identifica la institución, no valida tu identidad".

### 3.6 Registro — Paso 3: Datos del estudiante

- Campos: Nombres, Apellidos, Grado, Fecha de nacimiento.
- Subir foto del estudiante (avatar circular) — opcional.
- Bloque colapsable **"Verificar uniforme (opcional)"**: botón TOMAR FOTO; texto explicativo "Verificación asistida por visión artificial, no garantiza al 100% la identidad".
- Validación en vivo (regex) en email y DNI.

### 3.7 Registro — Paso 4: Apoderado

- Campos: Nombre, Relación (select: Madre/Padre/Tutor), Teléfono celular, Email.
- Campo extra: Contacto de emergencia secundario (opcional).
- Checkbox: "Autorizo el seguimiento de ubicación durante los recorridos".
- Botón "Crear cuenta".

### 3.8 Home — Estudiante (sin recorrido)

- Top bar "VíaSegura" + avatar.
- Saludo "Hola, Juan 👋" (final: sin emoji, solo texto).
- Card institución: escudo + "Colegio ABC".
- Estado card grande: círculo verde + "NO ESTÁS EN RECORRIDO".
- Botón grande "INICIAR RECORRIDO" (verde).
- Accesos rápidos (3 tarjetas): Mi ruta, Puntos seguros, Reportar incidencia.
- Botón emergencia (círculo 88dp).
- Bottom nav: Inicio, Ruta, Puntos seguros, Perfil.

### 3.9 Home — Recorrido activo

- Banner superior **"RECORRIDO ACTIVO"** verde.
- Mapa (placeholder con marcadores: Colegio → Tú → Casa).
- Card de información: Tiempo transcurrido, Estado (`chipVerde` Normal), progreso.
- Botón "FINALIZAR RECORRIDO" (primario).
- Botón emergencia siempre visible.
- Bottom nav igual.

### 3.10 Detección de recorrido inusual (modal)

- Modal con ícono ámbar ⚠️.
- Título: "Recorrido inusual".
- Texto: "Tu recorrido está tomando más tiempo de lo habitual".
- Botones: `Sí, estoy bien` (outline) / `Necesito ayuda` (danger).
- Si "Necesito ayuda" → dispara flujo de emergencia.

### 3.11 Emergencia — Pantalla de alerta

- Confirmación: "¿Deseas enviar una alerta?" con CANCELAR / CONFIRMAR.
- Al confirmar → pantalla "ALERTA ENVIADA" (check verde sobre círculo).
- Data compartida (se muestra en la pantalla): estudiante, institución, hora, última ubicación (mini mapa), botones LLAMAR y métodos de contacto.

### 3.12 Puntos seguros

- Lista ordenada por cercanía, cada card: ícono del tipo, nombre, distancia, ETA, (BOTÓN "IR AL PUNTO SEGURO") al tocar elige como destino.
- Tipos: Colegio, Tienda autorizada, Comisaría, Centro médico, Casa de familiar, Punto de encuentro.
- Chip de filtro por tipo arriba.

### 3.13 Reportar incidencia

- Select de tipo: Cruce peligroso, Vehículo a alta velocidad, Mala iluminación, Personas sospechosas, Otro.
- Campo de descripción opcional.
- Capturar foto (opcional).
- GPS snap de ubicación automática (mostrar "Ubicación actual detectada").
- Botón "ENVIAR REPORTE".

### 3.14 Mi ruta (historial)

- Lista de recorridos previos (fecha + hora inicio/fin + duración + estado).
- Cada item clicable → detalle con mapa estático.

---

## 4. Pantallas — Aplicación Android (Apoderado)

### 4.1 Home — Apoderado

- Encabezado con nombre del apoderado + ícono.
- Card del estudiante: avatar + nombre + estado (`chip` en recorrido / en casa / en colegio).
- Mapa del recorrido activo (placeholder).
- Info: Tiempo transcurrido, Estado, Última actualización.
- Botones: [VER UBICACIÓN] [📞 CONTACTAR] → llamada directa al estudiante.
- Listado de notificaciones recientes.
- Bottom nav: Inicio, Historial, Perfil.

### 4.2 Alerta de emergencia (vista apoderado)

- Card rojo: "🚨 ALERTA DE SEGURIDAD".
- Data: Estudiante, Institución, Hora.
- Última ubicación (enlace a mapa).
- Botones: LLAMAR AL ESTUDIANTE / LLAMAR AL COLEGIO.
- Timeline de eventos (llegada, inicio, emergencia) con timestamps.

---

## 5. Pantallas — Panel Web Institucional

> Responsive: sidebar colapsable en móvil. Layout `sidebar 260px + contenido`.

### 5.1 Login institución

- Centrado: logo, email, contraseña, botón "Ingresar al panel".
- Enlace "Solicitar acceso institucional".

### 5.2 Dashboard

- Top bar: buscador global + avatar institución.
- 4 KPI cards:
  - 👥 350 estudiantes registrados
  - 🟢 287 recorridos normales
  - 🟡 12 anomalías
  - 🔴 2 emergencias
- Sección "Mapa de incidencias" (mapa placeholder con pines).
- Lista "Incidencias recientes" (tabla/lista con timestamp en hora Perú `GMT-5`).
- Tarjeta "Zonas de riesgo" con barras de progreso:
  - Zona A · 12 reportes · `████████████`
  - Zona B · 7 reportes · `███████`
  - Zona C · 4 reportes · `████`

### 5.3 Estudiantes

- Tabla: Matrícula, Nombre, Grado, Estado (cuenta), Apoderado, Acciones.
- Filtros por grado y búsqueda.
- Acciones: ver detalle, activar/desactivar cuenta, asociar apoderado.

### 5.4 Incidencias / Zonas de riesgo

- Vista combinada: mapa de calor (placeholder) + listado filtrable por gravedad y rango de fechas.
- Detalle de incidencia: tipo, ubicación, descripción, reportado por, foto, timestamp.

---

## 6. Flujo de usuario canónico (MVP)

```
Splash
  → Selección de rol
    → [Estudiante] Login / Registro
        Registro: Paso 1 institución → Paso 2 QR → Paso 3 datos → Paso 4 apoderado
    → Home estudiante
        → INICIAR RECORRIDO → GPS activado → recorrido activo (mapa)
        → [NORMAL] → FINALIZAR → notificación "Llegada" al apoderado
        → [ANOMALÍA: tiempo > habitual] → modal ¿Estás bien?
            → "Necesito ayuda" → ALERTA → apoderado recibe push
        → Botón 🚨 EMERGENCIA → confirmar → alerta enviada → apoderado recibe push
    → [Apoderado] Home apoderado → ve recorrido del hijo → contacto directo
```

---

## 7. Estados de recorrido (máquina de estados)

| Estado | Color | Significado |
|---|---|---|
| `IDLE` | gris | No en recorrido |
| `ACTIVE` | verde | Recorrido en curso |
| `ANOMALY` | ámbar | Tiempo/GPS fuera de rango típico |
| `EMERGENCY` | rojo | Alerta de emergencia enviada |
| `COMPLETED` | verde oscuro | Llegó a destino y finalizó |

---

## 8. Especificaciones técnicas de diseño (notas para devs)

| Ítem | Especificación |
|---|---|
| Hora del sistema | **Zona horaria Perú `America/Lima` (GMT-5)** en todos los timestamps del panel y notificaciones |
| Mapa | Google Maps SDK Android / Google Maps JS API (panel) |
| QR | ZXing (librería de escaneo) |
| GPS | `FusedLocationProviderClient` + foreground service mientras dura el recorrido |
| Push | Firebase Cloud Messaging (token por dispositivo) |
| Datos | Firestore: colecciones `instituciones`, `estudiantes`, `apoderados`, `recorridos`, `incidencias`, `puntos_seguros` |
| Almacenamiento de recursos protegidos | Reglas Firestore seguras (lectura por rol) — nunca exponer location en reglas abiertas |

---

## 9. Checklist Figma

- [ ] Configurar 4 color styles (paleta completa con 14 tokens)
- [ ] Configurar text styles (escala Android y Web)
- [ ] Crear componentes: btns (5), chips (4), inputs, cards (3), topbar, bottom-nav, KPI
- [ ] Crear frame Android 360×800 (Device Pixel / estandarizado)
- [ ] Crear frame Web 1440×900
- [ ] Página 1: Estudiante (14 frames en "Flow 1")
- [ ] Página 2: Apoderado (2 frames en "Flow 2")
- [ ] Página 3: Panel Web (4 frames en "Flow 3")
- [ ] Conectar flujo interactivo: Registro → Home → Recorrido → Emergencia
- [ ] Compartir link editable con el equipo