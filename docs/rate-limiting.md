# Rate Limiting - Sistema de Límites de Solicitudes

Este documento describe el sistema de Rate Limiting implementado en la API del E-commerce, que protege contra ataques de fuerza bruta y spam.

## 📋 Tabla de Contenidos

- [Resumen](#resumen)
- [Configuración](#configuración)
- [Tipos de Rate Limiting](#tipos-de-rate-limiting)
- [Headers de Respuesta](#headers-de-respuesta)
- [Configuración por Entorno](#configuración-por-entorno)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🛡️ Resumen

El Rate Limiting es una técnica de seguridad que limita el número de solicitudes que un cliente puede hacer a la API en un período de tiempo determinado. Esto protege contra:

- **Ataques de fuerza bruta** en el login
- **Spam y abuso** de la API
- **Sobrecarga del servidor**
- **Consumo excesivo de recursos**

## ⚙️ Configuración

### Variables de Entorno

El sistema utiliza variables de entorno para configurar los límites por ambiente:

```bash
# Rate Limiting Global (requests por ventana de tiempo)
RATE_LIMIT_GLOBAL_MAX_PRODUCTION=1000      # Máximo requests en producción
RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION=900000 # Ventana de tiempo (15 min en ms)
RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT=5000     # Máximo requests en desarrollo
RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT=60000 # Ventana de tiempo (1 min en ms)

# Rate Limiting Auth (intentos de login por ventana de tiempo)
RATE_LIMIT_AUTH_MAX_PRODUCTION=10          # Máximo intentos en producción
RATE_LIMIT_AUTH_WINDOW_PRODUCTION=3600000  # Ventana de tiempo (1 hora en ms)
RATE_LIMIT_AUTH_MAX_DEVELOPMENT=100        # Máximo intentos en desarrollo
RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT=900000  # Ventana de tiempo (15 min en ms)

# Rate Limiting Test (valores para testing)
RATE_LIMIT_GLOBAL_MAX_TEST=10000           # Alto para permitir tests
RATE_LIMIT_GLOBAL_WINDOW_TEST=60000        # 1 minuto
RATE_LIMIT_AUTH_MAX_TEST=1000              # Alto para permitir tests
RATE_LIMIT_AUTH_WINDOW_TEST=60000          # 1 minuto
```

### Valores por Defecto

Si no se especifican variables de entorno, se usan estos valores:

| Entorno | Global Max | Global Window | Auth Max | Auth Window |
|---------|------------|---------------|----------|-------------|
| **Production** | 1000 | 15 min | 10 | 1 hora |
| **Development** | 5000 | 1 min | 100 | 15 min |
| **Test** | 10000 | 1 min | 1000 | 1 min |

## 🔒 Tipos de Rate Limiting

### 1. Rate Limiting Global

Se aplica a **todas las rutas** de la API:

- **Propósito**: Prevenir spam y sobrecarga general
- **Identificación**: Por dirección IP
- **Scope**: Todas las peticiones HTTP

```typescript
// Ejemplo de configuración
windowMs: 15 * 60 * 1000,  // 15 minutos
max: 1000,                 // 1000 requests por ventana
```

### 2. Rate Limiting de Autenticación

Se aplica **específicamente** a rutas de autenticación:

- **Rutas afectadas**:
  - `POST /api/auth/login`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- **Propósito**: Prevenir ataques de fuerza bruta
- **Identificación**: Por dirección IP

```typescript
// Ejemplo de configuración
windowMs: 60 * 60 * 1000,  // 1 hora
max: 10,                   // 10 intentos por ventana
```

## 📊 Headers de Respuesta

Cuando el rate limiting está activo, se incluyen estos headers en las respuestas:

### Headers Estándar (RFC 6585)

```http
RateLimit-Limit: 1000           # Límite máximo por ventana
RateLimit-Remaining: 999        # Requests restantes
RateLimit-Reset: 900            # Segundos hasta el reset
RateLimit-Policy: 1000;w=900    # Política completa
```

### Respuesta 429 (Too Many Requests)

Cuando se excede el límite:

```json
{
  "error": "Límite de solicitudes excedido",
  "message": "Has excedido el límite de solicitudes globales. Por favor, espera 15 minutos.",
  "statusCode": 429,
  "remainingTime": "14 minutos",
  "intentosRestantes": 0
}
```

En desarrollo, se incluye información adicional:

```json
{
  "debug": {
    "environment": "development",
    "limit": 100,
    "windowMs": "15 minutos"
  }
}
```

## 🌍 Configuración por Entorno

### Producción (`NODE_ENV=production`)

```yaml
Global:
  Límite: 1000 requests / 15 minutos
  Propósito: Uso normal de producción
  
Auth:
  Límite: 10 intentos / 1 hora  
  Propósito: Seguridad estricta contra ataques
```

**Características**:
- ✅ Límites estrictos para seguridad
- ✅ Sin información de debug
- ✅ Ventanas de tiempo largas

### Desarrollo (`NODE_ENV=development`)

```yaml
Global:
  Límite: 5000 requests / 1 minuto
  Propósito: Desarrollo sin restricciones excesivas
  
Auth:
  Límite: 100 intentos / 15 minutos
  Propósito: Testing de funcionalidades
```

**Características**:
- ✅ Límites permisivos para desarrollo
- ✅ Información de debug incluida
- ✅ Ventanas de tiempo cortas
- ✅ Headers adicionales de diagnóstico

### Testing (`NODE_ENV=test`)

```yaml
Global:
  Límite: 10000 requests / 1 minuto
  Propósito: Tests automatizados sin bloqueos
  
Auth:
  Límite: 1000 intentos / 1 minuto
  Propósito: Tests de autenticación
```

**Características**:
- ✅ Límites muy altos o deshabilitados
- ✅ Ventanas de tiempo muy cortas
- ✅ Configuración específica para CI/CD

## 🧪 Testing

### Scripts de Testing Disponibles

```bash
# Test básico de rate limiting
node scripts/quick-rate-test.js

# Test específico de producción
node scripts/test-production-rate-limit.js

# Test con configuración de variables de entorno
node scripts/test-configurable-rate-limit.js

# Test intensivo de autenticación
node scripts/test-auth-rate-limit.js

# Diagnóstico completo
node scripts/diagnose-rate-limit.js
```

### Ejemplo de Test Manual

```bash
# 1. Verificar configuración actual
curl http://localhost:3000/api/debug-config

# 2. Test de límite global
for i in {1..10}; do
  curl -w "Status: %{http_code}\\n" http://localhost:3000/api/products
done

# 3. Test de límite auth (hasta que falle)
for i in {1..15}; do
  curl -X POST -H "Content-Type: application/json" \\
    -d '{"email":"test@test.com","password":"wrong"}' \\
    -w "Status: %{http_code}\\n" \\
    http://localhost:3000/api/auth/login
done
```

## 🔧 Implementación Técnica

### Arquitectura

```
Request → [Global Rate Limiter] → [Route Specific Rate Limiter] → Controller
```

### Componentes Principales

1. **`RateLimitMiddleware`**: Clase principal que gestiona los limitadores
2. **`createGlobalLimiter()`**: Función que crea el limitador global
3. **`createAuthLimiter()`**: Función que crea el limitador de auth
4. **`keyGenerator`**: Función que identifica clientes únicos por IP

### Identificación de Clientes

El sistema identifica clientes únicos usando esta lógica:

```typescript
keyGenerator: (req) => {
  // 1. Intentar obtener IP real de headers de proxy
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  // 2. Usar IP detectada por Express
  let finalIP = req.ip;
  
  // 3. Procesar headers de proxy (múltiples IPs)
  if (forwardedFor) {
    finalIP = forwardedFor.split(',')[0].trim();
  } else if (realIP) {
    finalIP = realIP;
  }
  
  // 4. Fallback a IP de conexión
  if (!finalIP || finalIP === '::1' || finalIP === '127.0.0.1') {
    finalIP = req.connection?.remoteAddress || 'unknown-ip';
  }
  
  return finalIP;
}
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Rate Limiting No Funciona

**Síntomas**:
- No se ven headers `ratelimit-*`
- No se activa el límite después de muchas requests

**Soluciones**:
```bash
# Verificar NODE_ENV
echo $NODE_ENV

# Verificar que las variables estén cargadas
node -e "console.log(process.env.RATE_LIMIT_GLOBAL_MAX_PRODUCTION)"

# Verificar configuración actual
curl http://localhost:3000/api/debug-config
```

#### 2. Límites Muy Estrictos

**Síntomas**:
- Usuarios legítimos siendo bloqueados
- Error 429 muy frecuente

**Soluciones**:
```bash
# Ajustar variables en .env
RATE_LIMIT_AUTH_MAX_PRODUCTION=20        # Aumentar límite
RATE_LIMIT_AUTH_WINDOW_PRODUCTION=1800000 # Reducir ventana (30 min)
```

#### 3. Todos los Usuarios Comparten el Mismo Límite

**Síntomas**:
- Rate limiting se activa para todos los usuarios al mismo tiempo
- Headers muestran `unknown-ip` o IP del servidor

**Soluciones**:
```typescript
// Verificar configuración de proxy en server.ts
app.set('trust proxy', 1); // En lugar de 'loopback, linklocal, uniquelocal'

// O configurar IPs específicas de proxies conocidos
app.set('trust proxy', ['127.0.0.1', '10.0.0.0/8']);
```

#### 4. Rate Limiting en Testing

**Síntomas**:
- Tests fallan por rate limiting
- CI/CD falla por límites

**Soluciones**:
```bash
# Opción 1: Deshabilitar completamente en test
RATE_LIMIT_GLOBAL_MAX_TEST=0
RATE_LIMIT_AUTH_MAX_TEST=0

# Opción 2: Límites muy altos
RATE_LIMIT_GLOBAL_MAX_TEST=100000
RATE_LIMIT_AUTH_MAX_TEST=10000
```

### Logs de Diagnóstico

Agregar logging temporal para debugging:

```typescript
// En rate-limit.middleware.ts
handler: (req: Request, res: Response) => {
  console.log('Rate Limit Hit:', {
    ip: req.ip,
    url: req.url,
    userAgent: req.headers['user-agent'],
    forwardedFor: req.headers['x-forwarded-for']
  });
  
  // ... resto del handler
}
```

## 📈 Monitoreo y Métricas

### Métricas Recomendadas

1. **Requests bloqueadas por rate limiting** (429 responses)
2. **Distribución de IPs únicas** por período
3. **Patrones de uso** por endpoint
4. **Tiempo de respuesta** bajo rate limiting

### Alertas Sugeridas

```yaml
Alertas:
  - Rate limit global > 80% durante 5 minutos
  - Misma IP hitting auth rate limit > 3 veces/hora
  - Incremento súbito en 429 responses
```

## 🔄 Mantenimiento

### Actualizaciones de Configuración

```bash
# 1. Modificar .env
nano .env

# 2. Reiniciar aplicación
npm restart

# 3. Verificar nueva configuración
node scripts/test-configurable-rate-limit.js
```

### Mejoras Futuras

- [ ] **Rate limiting por usuario autenticado** (además de IP)
- [ ] **Límites escalonados** (más estrictos para IPs sospechosas)
- [ ] **Rate limiting distribuido** con Redis
- [ ] **Whitelist de IPs** conocidas y confiables
- [ ] **Rate limiting por endpoint** específico
- [ ] **Métricas y dashboards** de monitoreo

---

*Documentación actualizada: Enero 2025*
*Versión: 2.0*
