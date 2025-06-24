# StartUp E-commerce API (Backend)

**Este es el backend para una aplicación de E-commerce completa, construida con Node.js, TypeScript, Express y MongoDB. Incorpora características modernas como autenticación JWT, integración con pasarelas de pago, gestión de productos/clientes, un carrito de compras, sistema de cupones, panel de administración y un chatbot inteligente basado en RAG.**

## 🚀 Inicio Rápido

```bash
# Clonar el repositorio
git clone <repository-url>
cd 14-back

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar en desarrollo
npm run dev

# Ejecutar tests
npm test
```

## 📚 Documentación Completa

### 🔧 **Configuración e Instalación**
- **[📋 Instalación y Configuración](./docs/installation.md)** - Prerrequisitos, instalación paso a paso, variables de entorno y configuración inicial
- **[🏗️ Arquitectura del Proyecto](./docs/architecture.md)** - Estructura de carpetas, patrones de diseño y decisiones arquitectónicas

### 🌐 **API y Endpoints**
- **[🔐 Autenticación y Usuarios](./docs/api-auth.md)** - Registro, login, recuperación de contraseña, roles
- **[📦 Productos y Catálogo](./docs/api-products.md)** - Productos, categorías, tags, unidades, búsqueda avanzada
- **[🛒 Carrito y Pedidos](./docs/api-orders.md)** - Gestión de carrito, checkout, pedidos y ventas
- **[👥 Clientes y Direcciones](./docs/api-customers.md)** - Gestión de clientes, direcciones de envío, ubicaciones
- **[💰 Pagos y Descuentos](./docs/api-payments.md)** - Integración con MercadoPago, cupones, métodos de pago

### 🤖 **Funcionalidades Avanzadas**
- **[🤖 Chatbot e IA](./docs/api-chatbot.md)** - Sistema de chatbot con RAG, embeddings y búsqueda semántica
- **[🔌 Protocolo MCP](./docs/api-mcp.md)** - Model Context Protocol para integración con herramientas de IA
- **[📧 Sistema de Notificaciones](./docs/notifications.md)** - Email (Nodemailer) y Telegram

### 🛠️ **Administración y Monitoreo**
- **[⚙️ Panel de Administración](./docs/api-admin.md)** - Endpoints exclusivos para administradores
- **[📊 Monitoreo y Logs](./docs/monitoring.md)** - Sistema de logging, métricas y estadísticas
- **[🔗 Sistema de Webhooks](./docs/webhooks.md)** - Captura y análisis de webhooks de MercadoPago

### 🧪 **Testing y Desarrollo**
- **[🧪 Testing](./docs/testing.md)** - Configuración de tests, estructura y ejemplos
- **[🚧 Roadmap y TODOs](./docs/roadmap.md)** - Mejoras futuras y características pendientes

## ✨ Características Principales

- **🔐 Autenticación completa** con JWT, recuperación de contraseña y roles
- **📦 Gestión de productos** con búsqueda avanzada, filtros y categorización
- **🛒 Carrito de compras** persistente con soporte para usuarios registrados e invitados
- **💳 Integración con MercadoPago** para procesamiento de pagos
- **🏠 Gestión de direcciones** múltiples por cliente
- **🎫 Sistema de cupones** con validaciones avanzadas
- **🤖 Chatbot inteligente** con RAG y búsqueda semántica
- **📧 Notificaciones** por email y Telegram
- **⚙️ Panel de administración** completo
- **📊 Sistema de monitoreo** con logs detallados
- **🔗 Captura de webhooks** con trazabilidad completa

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js, TypeScript, Express.js
- **Base de Datos:** MongoDB con Mongoose
- **Autenticación:** JWT, Bcrypt
- **Pagos:** MercadoPago API
- **IA/ML:** Langchain, Transformers.js, Embeddings
- **Comunicación:** Nodemailer, Telegram Bot API
- **Cloud:** Cloudinary (imágenes)
- **Logging:** Winston
- **Testing:** Jest
- **Protocolo:** MCP (Model Context Protocol)

## 🏗️ Arquitectura

El proyecto sigue una **arquitectura limpia** inspirada en Clean Architecture con tres capas principales:

- **🎯 Domain** (`src/domain/`): Lógica de negocio pura (entities, DTOs, use cases, interfaces)
- **🔧 Infrastructure** (`src/infrastructure/`): Implementaciones concretas (datasources, adapters, mappers)
- **🌐 Presentation** (`src/presentation/`): Capa HTTP (controllers, routes, middlewares)

```
src/
├── domain/           # Lógica de negocio
├── infrastructure/   # Implementaciones
├── presentation/     # Capa HTTP
├── data/            # Modelos MongoDB
├── configs/         # Configuraciones
└── seeders/         # Datos iniciales
```

## 💎 Documentos Destacados

### 🚀 **Más Importantes**
- **[💳 Integración MercadoPago](./docs/mercadopago.md)** - **CRÍTICO** - Pagos, webhooks y trazabilidad completa
- **[📱 Notificaciones Telegram](./docs/telegram.md)** - **ESENCIAL** - Alertas en tiempo real
- **[📧 Notificaciones Email](./docs/email.md)** - **ESENCIAL** - Sistema completo de emails
- **[🔗 Sistema de Webhooks](./docs/webhooks.md)** - **CRÍTICO** - Captura y análisis total

## 📞 Soporte

Para dudas específicas sobre cada módulo, consulta la documentación correspondiente en la carpeta `docs/`.

---

**🚀 ¡Desarrollado con pasión para el ecosistema de E-commerce moderno!**
