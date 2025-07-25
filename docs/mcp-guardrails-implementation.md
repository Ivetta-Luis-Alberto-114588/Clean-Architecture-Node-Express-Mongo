# Implementación de Guardarriles para MCP - Guía Completa

## ✅ Implementación Co## 📋 Ejemplos de Consultas y Resultados

### ✅ **Consultas Permitidas - E-commerce General**

#### Ejemplo 1: Consulta General sobre Productos
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic \
  -H "Content-Type: application/json" \
  -H "x-session-id: ejemplo-1" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 200,
    "messages": [
      {
        "role": "user",
        "content": "¿Cuáles son los productos de lomito disponibles?"
      }
    ]
  }'
```

**Resultado:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Permíteme consultar los productos de lomito disponibles en el sistema...\n\nGeneralmente en un e-commerce de alimentos, los productos de lomito suelen incluir:\n\n1. Sándwich de lomito completo\n2. Lomito al plato\n3. Lomito a la pimienta..."
    }
  ],
  "stop_reason": "end_turn",
  "_guardrails": {
    "sessionId": "ejemplo-1",
    "processed": true,
    "timestamp": "2025-07-25T..."
  }
}
```

#### Ejemplo 2: Consulta sobre Proceso de Negocio
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic \
  -H "Content-Type: application/json" \
  -H "x-session-id: ejemplo-2" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 200,
    "messages": [
      {
        "role": "user",
        "content": "¿Cómo funciona el proceso de pedidos en el e-commerce?"
      }
    ]
  }'
```

**Resultado:** ✅ **PERMITIDA** - Responde con información general sobre procesos de e-commerce

### ✅ **Consultas Permitidas - Con Herramientas MCP**

#### Ejemplo 3: Búsqueda Específica de Productos
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic \
  -H "Content-Type: application/json" \
  -H "x-session-id: ejemplo-3" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 300,
    "messages": [
      {
        "role": "user",
        "content": "Busca específicamente los productos con la palabra lomito y muéstrame precios exactos"
      }
    ],
    "tools": [
      {
        "name": "get_products",
        "description": "Buscar productos",
        "input_schema": {
          "type": "object",
          "properties": {
            "search": {"type": "string"}
          },
          "required": ["search"]
        }
      }
    ]
  }'
```

**Resultado:**
```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Voy a buscar los productos que contengan la palabra \"lomito\" utilizando la herramienta de búsqueda de productos."
    },
    {
      "type": "tool_use",
      "id": "toolu_...",
      "name": "get_products",
      "input": {
        "search": "lomito"
      }
    }
  ],
  "stop_reason": "tool_use"
}
```

### ❌ **Consultas Bloqueadas**

#### Ejemplo 4: Consulta Política (Bloqueada)
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic \
  -H "Content-Type: application/json" \
  -H "x-session-id: ejemplo-4" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "¿Qué opinas sobre las próximas elecciones políticas?"
      }
    ]
  }'
```

**Resultado:**
```json
{
  "error": "Request blocked by guardrails",
  "reason": "blocked_content",
  "message": "No puedo ayudarte con ese tema. Mi función es asistir exclusivamente con consultas del e-commerce. ¿Te gustaría saber algo sobre nuestros productos o servicios?",
  "suggestions": "..."
}
```

#### Ejemplo 5: Consulta de Entretenimiento (Bloqueada)
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic \
  -H "Content-Type: application/json" \
  -H "x-session-id: ejemplo-5" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "¿Cuál es la película más popular del año?"
      }
    ]
  }'
```

**Resultado:** ❌ **BLOQUEADA** - Contiene palabras clave bloqueadas (entretenimiento)

### 📊 **Resumen de Comportamientos**

| Tipo de Consulta | Estado | Requiere Herramientas | Ejemplo |
|---|---|---|---|
| **E-commerce General** | ✅ Permitida | No | "¿Qué tipos de productos venden?" |
| **Información de Negocio** | ✅ Permitida | No | "¿Cómo hacer un pedido?" |
| **Datos Específicos** | ✅ Permitida | Sí | "Busca productos de lomito" |
| **Política/Religión** | ❌ Bloqueada | N/A | "¿Qué opinas de las elecciones?" |
| **Entretenimiento** | ❌ Bloqueada | N/A | "¿Cuál es la mejor película?" |
| **Información Personal** | ❌ Bloqueada | N/A | "Dame datos privados de usuarios" |

### 🌐 Nuevos Endpoints de Guardarrilespletada y Optimizada

Se ha implementado exitosamente un **sistema de guardarriles (guardrails)** optimizado para el modelo Claude AI que permite consultas generales sobre e-commerce mientras mantiene restricciones apropiadas.

### 🔄 Última Actualización (25 Julio 2025)
**Optimización de Guardarriles**: Se ajustó la configuración para permitir consultas generales sobre e-commerce sin requerir siempre el uso de herramientas MCP, manteniendo la protección contra contenido no relacionado.

## 📁 Archivos Creados/Modificados

### 1. Configuración de Guardarriles
**Archivo:** `src/configs/mcp-guardrails.ts`
- ✅ Configuración completa del sistema de restricciones
- ✅ System prompts para limitar el ámbito de Claude
- ✅ Reglas de contenido y palabras bloqueadas
- ✅ Límites de sesión y controles de uso

### 2. Servicio de Validación
**Archivo:** `src/infrastructure/services/mcp-guardrails.service.ts`
- ✅ Pipeline de validación de requests
- ✅ Gestión de sesiones de usuario
- ✅ Filtrado de contenido automático
- ✅ Límites de rate limiting por sesión

### 3. Controlador MCP Actualizado
**Archivo:** `src/presentation/mcp/controller.mcp.ts`
- ✅ Integración completa de guardarriles en `anthropicProxy`
- ✅ Validación antes de enviar requests a Claude
- ✅ Post-procesamiento de respuestas
- ✅ Endpoints de gestión de guardarriles

### 4. Rutas Actualizadas
**Archivo:** `src/presentation/mcp/routes.mcp.ts`
- ✅ Nuevas rutas para gestión de guardarriles
- ✅ Endpoints de monitoreo y control

## 🔒 Cómo Funcionan los Guardarriles (Versión Optimizada)

### 1. **Validación de Entrada**
Antes de que cualquier mensaje llegue a Claude, el sistema:
- ✅ Verifica si la consulta es sobre e-commerce (modo flexible)
- ✅ Bloquea palabras clave prohibidas (política, religión, etc.)
- ✅ Valida límites de sesión
- ✅ Permite consultas generales sobre e-commerce sin requerir herramientas

### 2. **System Prompt Balanceado**
Se inyecta automáticamente un system prompt optimizado:
```
Eres un asistente especializado en el sistema de e-commerce. Tu función es ayudar con consultas relacionadas con productos, clientes, pedidos, ventas, inventario y operaciones del negocio. Puedes responder preguntas generales sobre e-commerce y usar herramientas específicas cuando sea necesario para obtener datos exactos.

RESTRICCIONES:
- Mantente enfocado en temas de e-commerce y operaciones comerciales
- No respondas preguntas sobre política, religión, noticias generales, entretenimiento no relacionado
- Usa las herramientas MCP disponibles cuando necesites datos específicos del negocio
- Proporciona información útil sobre e-commerce general cuando no requiera datos específicos
```

### 3. **Configuración Optimizada**
- ✅ `strictMode: false` - Permite flexibilidad en consultas de e-commerce
- ✅ `requiredTools: false` - No requiere herramientas para todas las consultas
- ✅ `tool_required: enabled: false` - Sugiere herramientas solo cuando sea útil
- ✅ Mantiene bloqueo de contenido no relacionado con e-commerce

### 4. **Tipos de Consultas Permitidas**

#### ✅ **Consultas Generales de E-commerce** (NUEVAS - Ahora Permitidas)
- "¿Qué tipos de productos venden?"
- "¿Cómo funciona el proceso de pedidos?"
- "¿Cuáles son las formas de pago disponibles?"
- "¿Qué información necesito para hacer un pedido?"

#### ✅ **Consultas con Herramientas** (Ya Funcionaban)
- "Busca productos con la palabra 'lomito'"
- "¿Cuántos clientes tenemos registrados?"
- "Muéstrame los pedidos de hoy"

#### ❌ **Consultas Bloqueadas** (Siguen Bloqueadas)
- Política, religión, noticias generales
- Entretenimiento no relacionado
- Información personal sensible
- Temas controvertidos

## 🌐 Nuevos Endpoints de Guardarriles

### 1. **Configuración**
```
GET /api/mcp/guardrails/config
```
Devuelve la configuración actual de guardarriles.

### 2. **Estadísticas**
```
GET /api/mcp/guardrails/stats
```
Muestra estadísticas de uso y sesiones activas.

### 3. **Reset de Sesión**
```
POST /api/mcp/guardrails/sessions/{sessionId}/reset
```
Reinicia una sesión específica.

### 4. **Limpieza de Sesiones**
```
POST /api/mcp/guardrails/sessions/cleanup
```
Limpia todas las sesiones expiradas.

## 🚀 Cómo Probar los Guardarriles

### 1. **Iniciar el Servidor**
```bash
npm run dev
```

### 2. **Probar Request Válido (Debería Funcionar)**
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session-1" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "¿Cuáles son los productos más vendidos en la tienda?"
      }
    ]
  }'
```

### 3. **Probar Request Bloqueado (Debería Bloquearse)**
```bash
curl -X POST http://localhost:3000/api/mcp/anthropic/messages \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session-2" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [
      {
        "role": "user",
        "content": "¿Quién debería ganar las próximas elecciones presidenciales?"
      }
    ]
  }'
```

### 4. **Verificar Configuración**
```bash
curl -X GET http://localhost:3000/api/mcp/guardrails/config
```

### 5. **Ver Estadísticas**
```bash
curl -X GET http://localhost:3000/api/mcp/guardrails/stats
```

## 📋 Respuestas Esperadas

### ✅ **Request Válido (E-commerce)**
- Status: `200 OK`
- Claude responde normalmente sobre productos/e-commerce
- Metadata de guardarriles incluida en la respuesta

### ❌ **Request Bloqueado**
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Request blocked by guardrails",
  "reason": "Content contains blocked keywords",
  "message": "Lo siento, soy un asistente especializado en e-commerce...",
  "suggestions": "..."
}
```

### 🔍 **Límite de Sesión Excedido**
- Status: `400 Bad Request`
- Reason: "Session limit exceeded"

## 🛠️ Configuración Personalizable

En `src/configs/mcp-guardrails.ts` puedes modificar:

- **`enabled`**: Activar/desactivar guardarriles
- **`strictMode`**: Modo estricto para validación más rigurosa
- **`limits.requestsPerHour`**: Número máximo de requests por hora
- **`limits.maxTokensPerRequest`**: Tokens máximos por request
- **`contentRules.blockedKeywords`**: Palabras clave bloqueadas
- **`allowedTools`**: Herramientas MCP permitidas

## 🎯 Objetivo Logrado

✅ **Claude está ahora restringido EXCLUSIVAMENTE a consultas de e-commerce**
✅ **Sistema de guardarriles completamente funcional**
✅ **Monitoreo y control de sesiones implementado**
✅ **Filtrado automático de contenido no permitido**
✅ **Documentación y endpoints de gestión disponibles**

El sistema garantiza que Claude AI solo responda a consultas relacionadas con:
- Productos y categorías
- Clientes y pedidos
- Inventario y ventas
- Administración de tienda
- Pagos y envíos

**¡Los guardarriles están listos y funcionando!** 🎉

## 📊 Monitoreo y Logging de Consultas

### 🔍 **Sistema de Logging Implementado**

El sistema incluye logging automático de todas las consultas procesadas por los guardarriles:

#### **Logs de Guardarriles**
- **Ubicación**: `logs/combined-{env}-{date}.log`
- **Formato**: JSON estructurado
- **Información capturada**:
  - ID de sesión
  - Tipo de consulta (permitida/bloqueada)
  - Razón del bloqueo (si aplica)
  - Timestamp
  - Modelo usado
  - Tokens consumidos

#### **Ejemplo de Log Entry**
```json
{
  "timestamp": "2025-07-25T14:55:54.610Z",
  "level": "info",
  "message": "MCP Guardrails - Request processed",
  "sessionId": "test-session-fixed",
  "action": "allowed",
  "reason": "valid_ecommerce_query",
  "model": "claude-3-5-sonnet-20241022",
  "tokens": {
    "input": 255,
    "output": 200
  },
  "query_type": "general_ecommerce",
  "service": "mcp-guardrails"
}
```

### 📈 **Métricas de Monitoreo**

#### **Estadísticas Disponibles**
```bash
GET /api/mcp/guardrails/stats
```

**Respuesta:**
```json
{
  "status": "OK",
  "service": "MCP Guardrails Stats",
  "timestamp": "2025-07-25T...",
  "stats": {
    "activeSessions": 0,
    "totalRequests": 156,
    "allowedRequests": 142,
    "blockedRequests": 14,
    "blockReasons": {
      "blocked_content": 8,
      "tools_required": 4,
      "session_limit": 2
    },
    "topSessionIds": [
      "test-session-1",
      "production-user-123"
    ]
  }
}
```

#### **Monitoreo de Sesiones Activas**
```bash
GET /api/mcp/guardrails/sessions
```

#### **Limpieza de Sesiones Expiradas**
```bash
POST /api/mcp/guardrails/sessions/cleanup
```

### 🚨 **Alertas y Notificaciones**

#### **Configuración de Alertas**
- **Alto volumen de bloqueos**: >20% de requests bloqueados por hora
- **Intentos maliciosos**: Múltiples consultas bloqueadas de la misma sesión
- **Límites de sesión**: Sesiones que alcanzan el límite máximo

#### **Dashboard de Monitoreo** (Recomendado)
Considerar implementar un dashboard para visualizar:
- Gráficos de requests permitidos vs bloqueados
- Distribución de tipos de consultas
- Sesiones más activas
- Tendencias de uso por hora/día

**¡Los guardarriles están listos y funcionando!** 🎉
