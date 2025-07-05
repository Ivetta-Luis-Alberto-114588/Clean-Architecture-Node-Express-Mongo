# 🔧 Variables de Entorno - Configuración Completa

Guía completa de todas las variables de entorno necesarias para el funcionamiento del sistema.

## 📋 Índice

- [🚀 Variables Críticas](#-variables-críticas)
- [💳 MercadoPago](#-mercadopago)
- [📧 Email (Gmail)](#-email-gmail)
- [📱 Telegram](#-telegram)
- [☁️ Cloudinary](#-cloudinary)
- [🤖 APIs de IA](#-apis-de-ia)
- [🌐 URLs del Sistema](#-urls-del-sistema)
- [📝 Ejemplo Completo](#-ejemplo-completo)
- [🔍 Verificación](#-verificación)

---

## 🚀 Variables Críticas

### Básicas del Sistema
```env
NODE_ENV=production
PORT=10000
```

### Base de Datos
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=mystore
```

### Seguridad
```env
JWT_SEED=your-super-secret-jwt-seed-string-here
```

### Configuración por Defecto
```env
DEFAULT_NEIGHBORHOOD_ID=675a1a39dd398aae92ab05f2
```

---

## 💳 MercadoPago

### Credenciales Principales (REQUERIDAS)
```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890123456-070512-abcdef1234567890abcdef1234567890-123456789
MERCADO_PAGO_PUBLIC_KEY=APP_USR-12345678-abcd-1234-efgh-123456789012
```

### OAuth (Opcionales)
```env
MERCADO_PAGO_CLIENT_ID=1234567890123456
MERCADO_PAGO_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

**Dónde obtenerlas:**
1. Ir a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/)
2. Crear aplicación
3. Obtener credenciales de producción
4. Configurar webhook URL: `https://tu-backend.onrender.com/api/payments/webhook`

---

## 📧 Email (Gmail)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=laivetta@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_SENDER_NAME=StartUp E-commerce
```

**Configuración Gmail:**
1. **Habilitar 2FA** en tu cuenta Gmail
2. **Generar App Password:**
   - Ve a: [Configuración de cuenta Google](https://myaccount.google.com/security)
   - Seguridad → Verificación en 2 pasos
   - Contraseñas de aplicación → Generar
   - Usar la contraseña generada en `EMAIL_PASS`

---

## 📱 Telegram

```env
TELEGRAM_BOT_TOKEN=7905392744:AAHVobZq3mQtSOW41xd8js7RJSg2aOOl9Tk
TELEGRAM_CHAT_ID=736207422
```

**Configuración Telegram:**
1. **Crear Bot:**
   - Hablar con [@BotFather](https://t.me/BotFather)
   - `/newbot`
   - Seguir instrucciones
   - Obtener token y configurar en `TELEGRAM_BOT_TOKEN`

2. **Obtener Chat ID:**
   - Agregar bot al grupo/canal
   - Enviar mensaje
   - Ir a: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Buscar `"chat":{"id":-123456789}`
   - Usar ese ID en `TELEGRAM_CHAT_ID`

---

## ☁️ Cloudinary

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@your-cloud-name
```

**Configuración Cloudinary:**
1. Crear cuenta en [Cloudinary](https://cloudinary.com/)
2. Ir al Dashboard
3. Copiar las credenciales del panel principal

---

## 🤖 APIs de IA

```env
ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456789
OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456789
```

**Nota:** Estas son opcionales para funcionalidades de chatbot/IA.

---

## 🌐 URLs del Sistema

### Frontend
```env
FRONTEND_URL=https://front-startup.pages.dev
```

### Webhook de MercadoPago
```env
URL_RESPONSE_WEBHOOK_NGROK=https://sistema-mongo.onrender.com/
```

**Importante:** La URL del webhook debe terminar en `/` y debe ser accesible públicamente.

---

## 📝 Ejemplo Completo

```env
# ===== SISTEMA =====
NODE_ENV=production
PORT=10000

# ===== BASE DE DATOS =====
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=mystore

# ===== SEGURIDAD =====
JWT_SEED=your-super-secret-jwt-seed-string-here

# ===== CONFIGURACIÓN =====
DEFAULT_NEIGHBORHOOD_ID=675a1a39dd398aae92ab05f2

# ===== MERCADOPAGO =====
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890123456-070512-abcdef1234567890abcdef1234567890-123456789
MERCADO_PAGO_PUBLIC_KEY=APP_USR-12345678-abcd-1234-efgh-123456789012
MERCADO_PAGO_CLIENT_ID=1234567890123456
MERCADO_PAGO_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456

# ===== EMAIL =====
EMAIL_SERVICE=gmail
EMAIL_USER=laivetta@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_SENDER_NAME=StartUp E-commerce

# ===== TELEGRAM =====
TELEGRAM_BOT_TOKEN=7905392744:AAHVobZq3mQtSOW41xd8js7RJSg2aOOl9Tk
TELEGRAM_CHAT_ID=736207422

# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz123456@your-cloud-name

# ===== URLS =====
FRONTEND_URL=https://front-startup.pages.dev
URL_RESPONSE_WEBHOOK_NGROK=https://sistema-mongo.onrender.com/

# ===== IA (OPCIONALES) =====
ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456789
OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456789
```

---

## 🔍 Verificación

### ✅ Verificación en Startup

El sistema valida automáticamente las variables críticas al iniciar:

```
[ENV] Checking critical environment variables:
[ENV]   PORT: SET
[ENV]   MONGO_URL: SET
[ENV]   MONGO_DB_NAME: SET
[ENV]   JWT_SEED: SET
[ENV]   MERCADO_PAGO_ACCESS_TOKEN: SET
[ENV]   FRONTEND_URL: SET
[ENV]   NODE_ENV: SET
```

### ✅ Verificación de Notificaciones

```
🔍 [NotificationService] Inicializando canales. ActiveChannels: email, telegram
✅ [NotificationService] Configuración de Telegram encontrada
✅ [NotificationService] Telegram notification channel initialized
```

### ✅ Verificación de Email

```
Servicio de Email (gmail) configurado para enviar desde laivetta@gmail.com
Conexión SMTP verificada correctamente.
```

### 🚨 Variables Faltantes

Si falta alguna variable crítica, el sistema mostrará:

```bash
[ENV]   TELEGRAM_BOT_TOKEN: MISSING
```

Y puede fallar en el inicio o en funcionalidades específicas.

---

## 📋 Lista de Verificación

- [ ] Variables del sistema (`PORT`, `NODE_ENV`)
- [ ] Base de datos (`MONGO_URL`, `MONGO_DB_NAME`)
- [ ] Seguridad (`JWT_SEED`)
- [ ] MercadoPago (credenciales y webhook URL)
- [ ] Email (Gmail con app password)
- [ ] Telegram (bot token y chat ID)
- [ ] Cloudinary (para imágenes)
- [ ] URLs del frontend y webhook
- [ ] APIs de IA (opcionales)

**🎯 Una vez configuradas todas las variables, el sistema enviará automáticamente notificaciones de Email + Telegram cuando los pagos sean aprobados.**
