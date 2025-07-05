# Instrucciones de Deployment para Render.com

## Problema Resuelto: onnxruntime-node

El error que experimentabas en Render.com era causado por `onnxruntime-node`, una dependencia pesada para machine learning que requiere binarios específicos de la plataforma.

### Solución Implementada

1. **Dependencias Opcionales**: Se movieron todas las dependencias de IA a `optionalDependencies` en `package.json`
2. **Código Resiliente**: Los adapters ahora detectan si las dependencias están disponibles
3. **Graceful Degradation**: Si las funcionalidades de IA no están disponibles, el sistema sigue funcionando

### Configuración en Render.com

#### Opción 1: Build Command Estándar (Recomendado)
```
npm install && npm run build
```

#### Opción 2: Build Command Sin Dependencias Opcionales (Si aún hay problemas)
```
npm install --ignore-optional && npm run build:safe
```

#### Opción 3: Build Command con Timeout Extendido
```
npm install --fetch-timeout=300000 && npm run build
```

### Variables de Entorno en Render.com

Asegúrate de configurar estas variables:

```bash
NODE_ENV=production
PORT=3000
MONGO_URL=tu-string-de-conexion-mongodb
JWT_SEED=tu-jwt-secret
MERCADO_PAGO_ACCESS_TOKEN=tu-token-mp
MERCADO_PAGO_PUBLIC_KEY=tu-public-key-mp
URL_RESPONSE_WEBHOOK_NGROK=https://tu-app.onrender.com
FRONTEND_URL=https://tu-frontend.com
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
TELEGRAM_BOT_TOKEN=tu-bot-token
TELEGRAM_CHAT_ID=tu-chat-id
NOTIFICATION_CHANNELS=email,telegram
```

### Funcionalidades Afectadas

Con esta configuración:

✅ **Funcionan Normalmente:**
- Autenticación y autorización
- CRUD de productos, usuarios, pedidos
- Pagos con MercadoPago
- Notificaciones por email y Telegram
- Logging completo con Morgan
- Todas las funcionalidades principales del e-commerce

⚠️ **Deshabilitadas Temporalmente:**
- Chatbot con IA (búsqueda semántica)
- Generación de embeddings automática
- Funcionalidades de machine learning

### Logs de Diagnóstico

El sistema ahora loggea claramente el estado de las dependencias:

```
🤖 [TransformersAdapter] Dependencias de IA disponibles
```
o
```
⚠️ [TransformersAdapter] Dependencias de IA no disponibles - funcionalidades de chatbot deshabilitadas
```

### Re-habilitación de IA (Futuro)

Para reactivar las funcionalidades de IA en el futuro:

1. **Opción 1**: Usar un servicio externo de embeddings (OpenAI, Cohere, etc.)
2. **Opción 2**: Migrar a un proveedor cloud que soporte mejor estas dependencias
3. **Opción 3**: Usar contenedores Docker con las dependencias pre-compiladas

### Testing Local

Para probar que todo funciona sin las dependencias de IA:

```bash
# Simular entorno de producción
npm install --ignore-optional
npm run build
npm start
```

### Monitoreo

El sistema incluye logging detallado que te permitirá monitorear:
- Estado de las dependencias al inicio
- Peticiones HTTP completas (headers, bodies, timing)
- Notificaciones enviadas exitosamente
- Errores y su contexto completo

¡Tu aplicación ahora es más robusta y se deployará exitosamente en Render.com! 🚀
