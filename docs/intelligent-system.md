# 🧠 Sistema Inteligente con LangChain + Claude

## Descripción General

Este es un sistema alternativo al MCP (Model Context Protocol) que utiliza **LangChain** con **Claude** para procesar consultas de manera más natural y conversacional, sin necesidad de herramientas específicas o patrones rígidos.

## 🚀 Características Principales

### ✅ Ventajas sobre MCP
- **Lenguaje Natural**: No requiere patrones específicos como "precio de empanadas"
- **Flexibilidad**: Claude decide automáticamente qué herramientas usar
- **Conversacional**: Respuestas más naturales y amigables
- **Sin Rigidez**: No hay formatos SQL-like obligatorios
- **Fácil Extensión**: Agregar nuevas capacidades es simple

### 🔧 Tecnologías Utilizadas
- **LangChain**: Framework para aplicaciones de IA
- **@langchain/anthropic**: Integración con Claude
- **Claude 3.5 Haiku**: Modelo de lenguaje de Anthropic
- **DynamicTool**: Herramientas flexibles que entienden lenguaje natural
- **AgentExecutor**: Motor de ejecución inteligente con patrón React

## 📁 Estructura del Sistema

```
src/presentation/intelligent/
├── intelligent.assistant.ts    # Clase principal con lógica LangChain
├── intelligent.controller.ts   # Controlador HTTP
└── intelligent.routes.ts       # Definición de rutas
```

## 🛠️ Componentes Principales

### IntelligentAssistant
Clase principal que maneja:
- **Configuración de Claude**: Modelo, temperatura, tokens
- **Herramientas Dinámicas**: Búsqueda de productos, clientes, analytics
- **Agente React**: Procesamiento inteligente de consultas
- **Formateo de Respuestas**: Resultados legibles y útiles

### Herramientas Disponibles

#### 🍕 search_products_intelligent
- Búsqueda flexible de productos
- Acepta consultas como:
  - "¿Cuál es el precio de las empanadas?"
  - "¿Tienes pizza con provenzal?"
  - "Productos disponibles"

#### 👥 search_customers_intelligent  
- Búsqueda inteligente de clientes
- Acepta consultas como:
  - "Buscar cliente Juan"
  - "Información del cliente María"
  - "Cliente con email juan@example.com"

#### 📊 business_analytics
- Analytics e insights del negocio
- Acepta consultas como:
  - "Resumen del negocio"
  - "Estadísticas de ventas"
  - "Órdenes pendientes"

## 🌐 Endpoints Disponibles

### POST /api/intelligent/chat
**Consulta natural simple**

```json
{
  "message": "¿Cuál es el precio de las empanadas?"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "📍 Resultados de empanadas (3 productos):\n\n1. **Empanada de Carne**\n   💰 Precio: $450\n   📦 Stock: 50 unidades\n   🏷️ Categoría: Empanadas\n\n...",
  "timestamp": "2025-01-13T...",
  "system": "langchain-claude",
  "query": "¿Cuál es el precio de las empanadas?"
}
```

### POST /api/intelligent/anthropic
**Compatible con formato Anthropic MCP**

```json
{
  "messages": [
    {
      "role": "user", 
      "content": "¿Tienes pizza con provenzal?"
    }
  ]
}
```

**Respuesta:**
```json
{
  "id": "intelligent_1705167234567",
  "type": "message",
  "role": "assistant",
  "model": "langchain-claude-3-5-haiku-20241022",
  "content": [
    {
      "type": "text",
      "text": "Sí, tengo pizza con provenzal disponible..."
    }
  ],
  "_intelligent": {
    "processed": true,
    "system": "langchain-claude"
  }
}
```

### GET /api/intelligent/info
**Información del sistema**

Devuelve características, ventajas, endpoints disponibles y ejemplos.

### GET /api/intelligent/health
**Health check del sistema**

```json
{
  "success": true,
  "status": "healthy",
  "system": "langchain-claude",
  "timestamp": "2025-01-13T..."
}
```

## ⚙️ Configuración

### Variables de Entorno
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Inicialización
El sistema se inicializa automáticamente al recibir la primera consulta.

## 💡 Ejemplos de Uso

### Consultas de Productos
```bash
# Precio específico
curl -X POST http://localhost:3000/api/intelligent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cuál es el precio de las empanadas?"}'

# Disponibilidad
curl -X POST http://localhost:3000/api/intelligent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Tienes pizza con provenzal?"}'

# Búsqueda general
curl -X POST http://localhost:3000/api/intelligent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Qué productos de lomito hay disponibles?"}'
```

### Consultas de Clientes
```bash
curl -X POST http://localhost:3000/api/intelligent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Buscar información del cliente Juan Pérez"}'
```

### Analytics del Negocio
```bash
curl -X POST http://localhost:3000/api/intelligent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Dame un resumen del estado del negocio"}'
```

## 🔄 Comparación con MCP

| Aspecto | MCP Tradicional | Sistema Inteligente |
|---------|----------------|---------------------|
| **Consultas** | Patrones rígidos | Lenguaje natural |
| **Herramientas** | Específicas | Dinámicas |
| **Respuestas** | Estructuradas | Conversacionales |
| **Flexibilidad** | Baja | Alta |
| **Mantenimiento** | Complejo | Simple |
| **User Experience** | Técnica | Natural |

## 🚧 Estado Actual

### ✅ Completado
- [x] Configuración básica de LangChain + Claude
- [x] Herramientas dinámicas para productos
- [x] Controlador y rutas HTTP
- [x] Integración con repositorios existentes
- [x] Endpoints de compatibilidad
- [x] Manejo de errores

### 🔄 En Desarrollo
- [ ] Herramientas para órdenes
- [ ] Analytics avanzados
- [ ] Caché de respuestas
- [ ] Métricas de rendimiento

### 📋 Próximas Funcionalidades
- [ ] Historial de conversaciones
- [ ] Personalización por usuario
- [ ] Integración con notificaciones
- [ ] Dashboard de analytics

## 🧪 Testing

### Pruebas Manuales
1. **Productos**: Probar consultas de precios, disponibilidad, búsquedas
2. **Clientes**: Probar búsquedas por nombre, email, información
3. **Analytics**: Probar consultas de resumen, estadísticas
4. **Errores**: Probar respuestas a consultas inválidas

### Comandos de Testing
```bash
# Instalar dependencias
npm install

# Compilar proyecto
npm run build

# Ejecutar servidor
npm run dev

# Probar endpoint básico
curl http://localhost:3000/api/intelligent/health
```

## 📝 Notas de Desarrollo

### Principios de Diseño
1. **Naturalidad**: Las consultas deben ser como conversaciones normales
2. **Inteligencia**: El sistema debe entender intención, no solo patrones
3. **Flexibilidad**: Fácil de extender y personalizar
4. **Compatibilidad**: Mantener endpoints existentes funcionando
5. **Performance**: Respuestas rápidas y eficientes

### Mejores Prácticas
- Usar herramientas dinámicas en lugar de rígidas
- Formatear respuestas de manera amigable
- Manejar errores con mensajes útiles
- Loguear operaciones para debugging
- Mantener compatibilidad con sistema existente

---

**Última actualización**: 13 de enero de 2025  
**Versión**: 1.0.0  
**Sistema**: LangChain + Claude Alternative to MCP
