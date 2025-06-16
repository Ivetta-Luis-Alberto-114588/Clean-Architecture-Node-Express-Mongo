# StartUp E-commerce API (Backend)

**Este es el backend para una aplicación de E-commerce completa, construida con Node.js, TypeScript, Express y MongoDB. Incorpora características modernas como autenticación JWT, integración con pasarelas de pago, gestión de productos/clientes (con** **búsqueda y filtrado avanzados**, **gestión de direcciones**), un carrito de compras, sistema de cupones, un **panel de administración API** **y un chatbot inteligente basado en RAG (Retrieval-Augmented Generation).**

## 📑 Índice de Contenidos

- [✨ Características Principales](#-características-principales)
- [🛠️ Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [🏗️ Arquitectura](#-arquitectura)
- [📋 Prerrequisitos](#-prerrequisitos)
- [🚀 Instalación](#-instalación)
- [▶️ Ejecutar la Aplicación](#-ejecutar-la-aplicación)
- [🧪 Ejecutar Tests](#-ejecutar-tests-pendiente)
- [🌐 API Endpoints Principales](#-api-endpoints-principales)
- [📧 Sistema de Notificaciones](#-sistema-de-notificaciones)
- [🌐 API Endpoints Detallados](#-api-endpoints-detallados)
- [💡 Decisiones Arquitectónicas y Destacados](#-decisiones-arquitectónicas-y-destacados)
- [🚧 Mejoras Futuras / TODO](#-mejoras-futuras--todo)
- [🤝 Contribuciones](#-contribuciones)
- [📄 Licencia](#-licencia)

## 🔗 Enlaces Rápidos a Endpoints

### 🔐 Autenticación y Usuarios
- [👤 Autenticación (/api/auth)](#autenticación-apiauth)

### 📦 Productos y Categorías  
- [🛍️ Gestión de Productos (/api/products)](#productos-apiproducts)
- [📁 Gestión de Categorías (/api/categories)](#categorías-apicategories)
- [🏷️ Gestión de Tags (/api/tags)](#tags-etiquetas-apitags)
- [📏 Gestión de Unidades (/api/units)](#unidades-apiunits)

### 🛒 Carrito y Pedidos
- [🛒 Gestión del Carrito (/api/cart)](#carrito-apicart)
- [📦 Gestión de Pedidos (/api/sales)](#pedidosventas-apisales)

### 👥 Clientes y Direcciones
- [👤 Gestión de Clientes (/api/customers)](#clientes-apicustomers)
- [🏠 Gestión de Direcciones (/api/addresses)](#direcciones-apiaddresses)

### 🌍 Ubicaciones
- [🌍 Gestión de Ciudades (/api/cities)](#ciudades-apicities)
- [🏘️ Gestión de Barrios (/api/neighborhoods)](#barrios-apineighborhoods)

### 💰 Pagos y Descuentos
- [💳 Procesamiento de Pagos (/api/payments)](#pagos-apipayments)
- [💎 Métodos de Pago (/api/payment-methods)](#métodos-de-pago-apipayment-methods)
- [🎫 Sistema de Cupones (/api/coupons)](#cupones-apicoupons)

### 📧 Comunicación
- [📧 Notificaciones por Email](#notificaciones-por-email-nodemailer)
- [📱 Notificaciones de Telegram](#notificaciones-de-telegram)

### 🔧 Utilidades y Admin
- [🤖 IA y Chatbot (/api/chatbot)](#chatbot-apichatbot)
- [⚙️ Panel de Administración (/api/admin)](#administración-apiadmin)
- [📊 Sistema de Monitoreo (/api/monitoring)](#sistema-de-monitoreo-apimonitoring)

---

## ✨ Características Principales

* **Autenticación:**

  * **Registro de usuarios (con creación automática de perfil de cliente).**
  * **Inicio de sesión con JWT (JSON Web Tokens).**
  * **Recuperación de contraseña (solicitud y reseteo por email).**
  * **Middleware para proteger rutas (**validateJwt**).**
  * **Middleware para verificación de roles (**checkRole**).**
* **Gestión de Productos:**

  * **CRUD completo para Productos, Categorías,** **Tags (Etiquetas)** **y Unidades de medida.**
  * **Búsqueda y Filtrado Avanzado:** **Búsqueda por texto (nombre, descripción), filtrado por categoría(s),** **etiqueta(s) (ej: "popular", "combo")**, rango de precios y ordenamiento configurable.
  * **Asociación de productos con categorías y unidades.**
  * **Etiquetado (Tags):** **Asignar múltiples etiquetas a productos para clasificación y filtrado.**
  * **Cálculo de precios con IVA.**
  * **Gestión de stock básica (decremento al crear pedido, restauración al cancelar).**
* **Gestión de Clientes:**

  * **CRUD completo para Clientes (con soporte para invitados).**
  * **Vinculación de Usuarios registrados con perfiles de Cliente.**
  * **CRUD completo para Ciudades y Barrios (asociados a ciudades).**
  * **Gestión de Direcciones:**

    * **Usuarios registrados pueden añadir, ver, actualizar y eliminar múltiples direcciones de envío.**
    * **Marcar una dirección como predeterminada.**
    * **Seleccionar dirección guardada durante el checkout.**
    * **Soporte para ingresar dirección nueva durante el checkout (registrados e invitados).**
* **Carrito de Compras:**

  * **Añadir/actualizar/eliminar ítems.**
  * **Obtener el carrito del usuario actual.**
  * **Vaciar carrito.**
  * **Almacena precios y tasas de IVA al momento de agregar el ítem.**
* **Gestión de Pedidos (Ventas):**
  * **Creación de pedidos usando dirección seleccionada, nueva o default.**
  * **Snapshot de la dirección de envío guardado en cada pedido.**
  * **Cálculo automático de subtotales, impuestos, descuentos y total.**
  * **Aplicación de cupones de descuento (porcentual o fijo).**
  * **Actualización de estado del pedido (pendiente, completado, cancelado).**
  * **Notificaciones automáticas por email al crear pedidos nuevos.**
  * **Historial de pedidos para el usuario autenticado (**/my-orders**).**
  * **Búsqueda/listado de pedidos para administración.**
* **Métodos de Pago:**

  * **CRUD completo para Métodos de Pago (efectivo, tarjetas, transferencias, etc.).**
  * **Configuración de métodos activos/inactivos dinámicamente.**
  * **Asociación automática de estados de pedido por método de pago.**
  * **Clasificación entre pagos online y offline.**
  * **Endpoints públicos para consulta de métodos disponibles.**
  * **Gestión administrativa protegida por roles.**
* **Integración de Pagos (Mercado Pago):**

  * **Creación de preferencias de pago.**
  * **Manejo de callbacks (success, failure, pending) con redirección al frontend.**
  * **Procesamiento de webhooks para actualizar estado de pago/pedido.**
  * **Verificación del estado del pago/preferencia.**
  * **Soporte para claves de idempotencia.**
* **Sistema de Cupones:**

  * **CRUD completo para Cupones.**
  * **Validaciones (fechas, monto mínimo, límite de uso).**
  * **Incremento automático del contador de uso.**
* **Chatbot Inteligente (RAG):**

  * **Modelo basado en Retrieval-Augmented Generation con** **Transformers.js** **y** **Langchain**.
  * **Generación/validación de embeddings para datos clave (Productos, Categorías, Clientes, etc.).**
  * **Integración con LLMs (OpenAI GPT, Anthropic Claude).**
  * **Modos Cliente/Dueño y gestión de sesiones.**
* **Panel de Administración (API):**

  * **Endpoints dedicados bajo** **/api/admin** **protegidos por rol** **ADMIN_ROLE**.
  * **Permite gestionar Productos, Categorías, Unidades,** **Tags**, **Métodos de Pago**, Pedidos, Clientes, Ciudades, Barrios, Cupones y Usuarios.
* **Subida de Imágenes (Cloudinary):**

  * **Integración para subir/eliminar imágenes de productos.**
* **Notificaciones por Email (Nodemailer):**

  * **Envío de correos para restablecimiento de contraseña.**
  * **Sistema de notificaciones automáticas para pedidos.**
  * **Arquitectura extensible con múltiples canales (Email, Telegram).**
  * **Notificaciones HTML formateadas con detalles del pedido.**
  * **Configuración por variables de entorno con validación SMTP.**
* **Infraestructura y Calidad:**

  * **Arquitectura en capas (Domain, Infrastructure, Presentation).**
  * **DataSources, Repositories, Casos de Uso, Mappers, DTOs.**
  * **Manejo centralizado de errores (CustomError).**
  * **Logging avanzado (Winston).**
  * **Middlewares: Rate Limiting, Logging, Autenticación (JWT, Roles), Subida de archivos (Multer).**
  * **Variables de entorno centralizadas (**dotenv**,** **env-var**).
  * **CORS configurado.**

## 🛠️ Tecnologías Utilizadas

* **Backend:** **Node.js, Express.js**
* **Lenguaje:** **TypeScript**
* **Base de Datos:** **MongoDB con Mongoose (Índices de Texto, Aggregation Pipeline)**
* **Autenticación:** **JWT (jsonwebtoken), bcryptjs**
* **Pagos:** **Mercado Pago SDK (vía API REST con Axios)**
* **Chatbot:** **Langchain.js, Transformers.js, OpenAI/Anthropic API**
* **Subida de Imágenes:** **Cloudinary, Multer**
* **Emails:** **Nodemailer**
* **Logging:** **Winston, winston-daily-rotate-file**
* **Variables de Entorno:** **dotenv, env-var**
* **Rate Limiting:** **express-rate-limit**
* **Otros:** **CORS, uuid**

## 🏗️ Arquitectura

El proyecto sigue una arquitectura en capas inspirada en principios de Clean Architecture:

* **Domain:** **Contiene la lógica de negocio pura, entidades, casos de uso, interfaces de repositorios y datasources. No depende de frameworks ni de detalles de infraestructura.**
* **Infrastructure:** **Implementa las interfaces definidas en el dominio. Contiene los datasources concretos (ej: MongoDB), repositorios concretos, mappers y adaptadores para servicios externos (JWT, bcrypt, email, pagos, Cloudinary, etc.).**
* **Presentation:** **Expone la API REST usando Express. Contiene los controladores, rutas y middlewares. Interactúa con los casos de uso del dominio.**

## 📋 Prerrequisitos

* **Node.js (v18+)**
* **npm o yarn**
* **MongoDB (v5+ recomendado)**
* **Cuenta de Cloudinary**
* **Cuenta de Mercado Pago**
* **Claves API para OpenAI y/o Anthropic**
* **Credenciales de un servicio de email**

## 🚀 Instalación

* **Clona el repositorio:**

  ```
  git clone <tu-repositorio-url>
  cd <nombre-del-directorio>
  ```
* **Instala las dependencias:**

  ```
  npm install
  # o
  yarn install
  ```
* **Configura las variables de entorno (**.env**):** **(Asegúrate de tener todas las claves necesarias, incluyendo** **DEFAULT_NEIGHBORHOOD_ID**)

  ```
  # Server
  PORT=3000
  NODE_ENV=development # development | production | test
  FRONTEND_URL=http://localhost:4200 # O tu URL de frontend

  # MongoDB
  MONGO_URL=mongodb://localhost:27017/ecommerce_db # Ajusta si es necesario
  MONGO_DB_NAME=ecommerce_db
  DEFAULT_NEIGHBORHOOD_ID=YOUR_DEFAULT_NEIGHBORHOOD_MONGO_ID # <-- Asegúrate de tener esto

  # JWT
  JWT_SEED=TU_JWT_SEED_SECRETO

  # Mercado Pago
  MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxx # Tu Access Token
  MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx # Tu Public Key

  # LLM APIs
  ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxx
  OPENAI_API_KEY=sk-xxxxxxxxxx

  # Webhook (Usa ngrok: https://ngrok.com/ o un servicio similar para desarrollo)
  URL_RESPONSE_WEBHOOK_NGROK=https://xxxx-xxxx-xxxx.ngrok-free.app # Reemplaza con tu URL pública

  # Cloudinary
  CLOUDINARY_CLOUD_NAME=tu_cloud_name
  CLOUDINARY_API_KEY=tu_api_key
  CLOUDINARY_API_SECRET=tu_api_secret
  CLOUDINARY_URL=cloudinary://tu_api_key:tu_api_secret@tu_cloud_name
  # Email Service (ej. Gmail App Password)
  EMAIL_SERVICE=gmail
  EMAIL_USER=tu_correo@gmail.com
  EMAIL_PASS=tu_contraseña_de_aplicacion
  EMAIL_SENDER_NAME="Tu Tienda Online"

  # Notification System
  NOTIFICATION_EMAIL_TO=destinatario@gmail.com # Email donde llegan las notificaciones de pedidos
  NOTIFICATION_TELEGRAM_BOT_TOKEN=your_telegram_bot_token # Token del bot de Telegram (opcional)
  NOTIFICATION_TELEGRAM_CHAT_ID=your_chat_id # ID del chat de Telegram (opcional)

  # Opcional: Log Level (debug, info, warn, error)
  # LOG_LEVEL=debug
  ```

  **content_copy**download

  Use code [with caution](https://support.google.com/legal/answer/13505487).**Env**
* **(Importante) Crear índices de MongoDB:** **Conéctate a tu shell de Mongo (**mongosh**) y ejecuta:**

  ```
  use ecommerce_db # O el nombre de tu BD
  db.products.createIndex({ name: "text", description: "text" }, { weights: { name: 10, description: 5 }, name: "ProductTextIndex" })
  db.products.createIndex({ tags: 1 }) # <-- NUEVO ÍNDICE PARA TAGS
  db.tags.createIndex({ name: 1 }, { unique: true }) # <-- NUEVO ÍNDICE PARA TAGS
  db.customers.createIndex({ email: 1 }, { unique: true })
  db.customers.createIndex({ userId: 1 }, { unique: true, sparse: true })
  db.users.createIndex({ email: 1 }, { unique: true })
  db.payments.createIndex({ externalReference: 1 }, { unique: true })
  db.payments.createIndex({ preferenceId: 1 }, { unique: true })
  db.addresses.createIndex({ customerId: 1 })  db.categories.createIndex({ name: 1 }, { unique: true }) // Asumiendo unicidad
  db.units.createIndex({ name: 1 }, { unique: true }) // Asumiendo unicidad
  db.cities.createIndex({ name: 1 }, { unique: true }) // Asumiendo unicidad
  db.neighborhoods.createIndex({ name: 1, city: 1 }, { unique: true }) // Índice compuesto
  db.coupons.createIndex({ code: 1 }, { unique: true }) // Asumiendo unicidad
  db.paymentmethods.createIndex({ code: 1 }, { unique: true }) // Métodos de pago únicos por código
  // Revisa otros índices que puedas necesitar
  ```

## ▶️ Ejecutar la Aplicación

* **Modo Desarrollo:**

  ```
  npm run dev
  ```
* **Compilar y Ejecutar en Producción:**

  ```
  npm run build
  npm start
  ```

**La API estará en** **http://localhost:PORT**.

## 🧪 Ejecutar Tests (Pendiente)

```
npm test
```

**🌐 API Endpoints Principales**

## 📧 Sistema de Notificaciones

[⬆️ Volver al Índice](#-índice-de-contenidos)

### 🔔 Notificaciones Automáticas de Pedidos

El sistema incluye un **sistema de notificaciones automáticas** que se activa cuando se crea un nuevo pedido:

#### ✨ **Características:**
- **Activación automática:** Se dispara al crear un pedido exitosamente
- **No bloquea la respuesta:** Las notificaciones se envían de forma asíncrona
- **Múltiples canales:** Soporte para Email y Telegram
- **Formato HTML:** Emails con diseño profesional y responsivo
- **Manejo de errores:** Si falla la notificación, no afecta el pedido

#### 📨 **Contenido del Email:**
- **Asunto:** `🛒 Nueva Orden Recibida!`
- **Información incluida:**
  - ID y número de orden
  - Datos del cliente (nombre, email)
  - Listado de productos con cantidades y precios
  - Total del pedido
  - Fecha y hora de creación
  - Dirección de envío

#### ⚙️ **Configuración:**

**Variables de entorno requeridas:**
```env
# Email (obligatorio)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=tu_email@gmail.com
EMAIL_SMTP_PASS=tu_password_de_aplicacion
EMAIL_FROM=tu_email@gmail.com
EMAIL_TO=destinatario@gmail.com

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=tu_bot_token
TELEGRAM_CHAT_ID=tu_chat_id

# Canales activos
NOTIFICATION_CHANNELS=email,telegram
```

#### 🚀 **Uso:**
Las notificaciones se envían automáticamente cuando se hace:
```
POST /api/sales
```

No requiere configuración adicional en el frontend. El sistema detecta automáticamente cuando se crea un pedido y envía las notificaciones correspondientes.

#### 📱 **Telegram (Opcional):**
Para configurar Telegram:
1. Crear un bot con @BotFather
2. Obtener el token del bot
3. Obtener tu chat ID visitando: `https://api.telegram.org/bot{TOKEN}/getUpdates`
4. Configurar las variables de entorno

---

## 💡 Decisiones Arquitectónicas y Destacados

* **TypeScript, Arquitectura en Capas, Inyección de Dependencias, DTOs, Mappers.**
* **Logging Detallado (Winston), Rate Limiting.**
* **Autenticación JWT y autorización por Roles.**
* **Búsqueda/Filtrado eficiente con MongoDB nativo (incluyendo filtro por** **tags**).
* **Gestión de Direcciones de Envío separada.**
* **Snapshot de Dirección en Pedidos.**
* **Sistema de Notificaciones Extensible con múltiples canales (Email, Telegram).**
* **Panel de Administración API (**/api/admin**).**
* **Chatbot RAG con Langchain y Transformers.js.**
* **Integraciones: Mercado Pago, Cloudinary, Nodemailer.**

## 🚧 Mejoras Futuras / TODO

**Prioridad Alta (Funcionalidad Core / Calidad):**

* **Pruebas:** **Unitarias, Integración, E2E.**
* **Lógica de Envío y Cálculo de Costos.**
* **Gestión de Variaciones de Producto.**
* **Gestión de Inventario Robusta.**
* **Roles y Permisos (RBAC):** **Implementar** **AuthMiddleware.checkRole** **efectivamente.**
* **Documentación de API (Swagger/OpenAPI).**

**Prioridad Media (UX / Operación):**

* **Panel de Administración Frontend.**
* **Sistema de Reseñas y Calificaciones.**
* **Flujo de Pedidos Detallado (Estados, Tracking).**
* **Optimización de Búsqueda (Facetas, Autocomplete).**
* **Gestión de Devoluciones (RMA).**

**Prioridad Baja (Competitividad / Extras):**

* **Wishlist.**
* **Recomendaciones de Productos.**
* **Promociones Avanzadas.**
* **Refinar Lógica del Chatbot.**
* **Integración con Analítica.**
* **Soporte Multi-idioma/Multi-moneda.**
* **Optimización SEO (si aplica al backend).**
* **Scripts de Despliegue (Docker).**
* **Añadir más proveedores de pago.**

## 🤝 Contribuciones

**Las contribuciones son bienvenidas. Por favor, abre un issue o un Pull Request.**

## 📄 Licencia

**(Opcional: Especifica tu licencia, ej. MIT)**

## 🌐 API Endpoints Detallados

[⬆️ Volver al Índice](#-índice-de-contenidos) | [🔗 Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

---

### Autenticación (**/api/auth**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **POST /register**

- **Descripción**: Registra un nuevo usuario en el sistema y crea un perfil de cliente básico asociado.
- **Autenticación**: No requerida
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "email": "string (requerido, formato email válido)",
  "password": "string (requerido, mínimo 6 caracteres)"
}
```

- **Respuesta exitosa (201)**:

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": ["USER_ROLE"],
    "img": "string"
  },
  "token": "string (JWT)"
}
```

#### **POST /login**

- **Descripción**: Autentica a un usuario existente usando email y contraseña, devuelve un token JWT.
- **Autenticación**: No requerida
- **Rate Limit**: Aplicado
- **Cuerpo de la petición**:

```json
{
  "email": "string (requerido, formato email válido)",
  "password": "string (requerido)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": ["string"],
    "img": "string"
  },
  "token": "string (JWT)"
}
```

#### **GET /**

- **Descripción**: Verifica un token JWT válido y devuelve los datos del usuario autenticado.
- **Autenticación**: JWT requerido
- **Respuesta exitosa (200)**:

```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": ["string"],
    "img": "string"
  }
}
```

#### **GET /all**

- **Descripción**: Obtiene una lista paginada de todos los usuarios registrados.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": ["string"],
      "img": "string",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

#### **PUT /:id**

- **Descripción**: Actualiza la información de un usuario específico.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del usuario)
- **Cuerpo de la petición**:

```json
{
  "name": "string (opcional)",
  "email": "string (opcional)",
  "role": ["string"] (opcional)
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "Usuario actualizado",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": ["string"],
    "img": "string"
  }
}
```

#### **DELETE /:id**

- **Descripción**: Elimina un usuario específico del sistema.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del usuario)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Usuario eliminado"
}
```

#### **POST /forgot-password**

- **Descripción**: Inicia el proceso de recuperación de contraseña.
- **Autenticación**: No requerida
- **Rate Limit**: Aplicado
- **Cuerpo de la petición**:

```json
{
  "email": "string (requerido, formato email válido)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "Si el email está registrado, recibirás un enlace de recuperación"
}
```

#### **POST /reset-password**

- **Descripción**: Permite establecer una nueva contraseña usando un token válido.
- **Autenticación**: No requerida
- **Rate Limit**: Aplicado
- **Cuerpo de la petición**:

```json
{
  "token": "string (requerido, token recibido por email)",
  "password": "string (requerido, nueva contraseña)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

---

### Productos (**/api/products**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /search**

- **Descripción**: Realiza búsquedas de productos por palabra clave y permite filtrar por categorías, etiquetas, rango de precios, y ordenar los resultados.
- **Autenticación**: No requerida
- **Query Parameters**:
  - `q`: string (opcional, búsqueda por nombre/descripción)
  - `categories`: string (opcional, CSV de IDs de categorías)
  - `tags`: string (opcional, CSV de etiquetas, ej: "popular,oferta")
  - `minPrice`: number (opcional)
  - `maxPrice`: number (opcional)
  - `sortBy`: string (opcional: "price", "createdAt", "name", "relevance")
  - `sortOrder`: string (opcional: "asc", "desc")
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "priceWithTax": "number",
      "stock": "number",
      "category": {
        "id": "string",
        "name": "string",
        "description": "string"
      },
      "unit": {
        "id": "string",
        "name": "string",
        "abbreviation": "string"
      },
      "imgUrl": "string",
      "isActive": "boolean",
      "taxRate": "number",
      "tags": ["string"]
    }
  ]
}
```

#### **GET /by-category/:categoryId**

- **Descripción**: Lista productos pertenecientes a una categoría específica.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `categoryId` (ObjectId de la categoría)
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**: Misma estructura que `/search`

#### **GET /**

- **Descripción**: Lista todos los productos activos.
- **Autenticación**: No requerida
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**: Misma estructura que `/search`

#### **GET /:id**

- **Descripción**: Obtiene los detalles de un producto específico por su ID.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `id` (ObjectId del producto)
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "priceWithTax": "number",
  "stock": "number",
  "category": {
    "id": "string",
    "name": "string",
    "description": "string"
  },
  "unit": {
    "id": "string",
    "name": "string",
    "abbreviation": "string"
  },
  "imgUrl": "string",
  "isActive": "boolean",
  "taxRate": "number",
  "tags": ["string"]
}
```

#### **POST /**

- **Descripción**: Crea un nuevo producto.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Tipo de contenido**: `multipart/form-data`
- **Campos del formulario**:
  - `name`: string (requerido)
  - `description`: string (requerido)
  - `price`: number (requerido, > 0)
  - `stock`: number (requerido, > 0)
  - `category`: string (requerido, ObjectId válido)
  - `unit`: string (requerido, ObjectId válido)
  - `isActive`: boolean (opcional, default: true)
  - `taxRate`: number (opcional, default: 21, rango: 0-100)
  - `tags`: string o array (opcional, CSV o array de strings)
  - `image`: file (opcional, imagen para subir)
- **Respuesta exitosa (201)**: Misma estructura que GET /:id

#### **PUT /:id**

- **Descripción**: Actualiza un producto existente.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del producto)
- **Tipo de contenido**: `multipart/form-data`
- **Campos del formulario**: Mismos que POST (todos opcionales)
- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **DELETE /:id**

- **Descripción**: Elimina un producto y su imagen asociada.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del producto)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Producto eliminado",
  "product": {
    "id": "string",
    "name": "string"
  }
}
```

---

### Categorías (**/api/categories**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /**

- **Descripción**: Lista todas las categorías disponibles.
- **Autenticación**: No requerida
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "categories": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "isActive": "boolean"
    }
  ]
}
```

#### **GET /:id**

- **Descripción**: Obtiene una categoría específica por su ID.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `id` (ObjectId de la categoría)
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "isActive": "boolean"
}
```

#### **POST /**

- **Descripción**: Crea una nueva categoría.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "description": "string (requerido)",
  "isActive": "boolean (requerido)"
}
```

- **Respuesta exitosa (201)**: Misma estructura que GET /:id

#### **PUT /:id**

- **Descripción**: Actualiza una categoría existente.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId de la categoría)
- **Cuerpo de la petición**:

```json
{
  "name": "string (opcional)",
  "description": "string (opcional)",
  "isActive": "boolean (opcional)"
}
```

- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **DELETE /:id**

- **Descripción**: Elimina una categoría.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId de la categoría)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Categoría eliminada"
}
```

---

### Tags (Etiquetas) (**/api/tags**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /**

- **Descripción**: Lista todas las etiquetas activas disponibles.
- **Autenticación**: No requerida
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "tags": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "isActive": "boolean",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

---

### Unidades (**/api/units**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /**

- **Descripción**: Lista todas las unidades de medida disponibles.
- **Autenticación**: No requerida
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "units": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "isActive": "boolean"
    }
  ]
}
```

#### **GET /:id**

- **Descripción**: Obtiene una unidad específica por su ID.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `id` (ObjectId de la unidad)
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "isActive": "boolean"
}
```

#### **POST /**

- **Descripción**: Crea una nueva unidad de medida.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "description": "string (requerido)",
  "isActive": "boolean (opcional, default: true)"
}
```

- **Respuesta exitosa (201)**: Misma estructura que GET /:id

#### **PUT /:id**

- **Descripción**: Actualiza una unidad existente.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId de la unidad)
- **Cuerpo de la petición**:

```json
{
  "name": "string (opcional)",
  "description": "string (opcional)",
  "isActive": "boolean (opcional)"
}
```

- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **DELETE /:id**

- **Descripción**: Elimina una unidad.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId de la unidad)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Unidad eliminada"
}
```

---

### Ciudades (**/api/cities**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /**

- **Descripción**: Lista todas las ciudades disponibles.
- **Autenticación**: No requerida
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "cities": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "isActive": "boolean"
    }
  ]
}
```

#### **GET /:id**

- **Descripción**: Obtiene una ciudad específica por su ID.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `id` (ObjectId de la ciudad)
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "isActive": "boolean"
}
```

#### **GET /by-name/:name**

- **Descripción**: Busca una ciudad por su nombre exacto.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `name` (nombre exacto de la ciudad)
- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **POST /**

- **Descripción**: Crea una nueva ciudad.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "description": "string (requerido)",
  "isActive": "boolean (opcional, default: true)"
}
```

- **Respuesta exitosa (201)**: Misma estructura que GET /:id

#### **PUT /:id**

- **Descripción**: Actualiza una ciudad existente.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId de la ciudad)
- **Cuerpo de la petición**:

```json
{
  "name": "string (opcional)",
  "description": "string (opcional)",
  "isActive": "boolean (opcional)"
}
```

- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **DELETE /:id**

- **Descripción**: Elimina una ciudad.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId de la ciudad)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Ciudad eliminada"
}
```

---

### Barrios (**/api/neighborhoods**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /**

- **Descripción**: Lista todos los barrios disponibles.
- **Autenticación**: No requerida
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "neighborhoods": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "city": {
        "id": "string",
        "name": "string",
        "description": "string",
        "isActive": "boolean"
      },
      "isActive": "boolean"
    }
  ]
}
```

#### **GET /:id**

- **Descripción**: Obtiene un barrio específico por su ID.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `id` (ObjectId del barrio)
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "city": {
    "id": "string",
    "name": "string",
    "description": "string",
    "isActive": "boolean"
  },
  "isActive": "boolean"
}
```

#### **GET /by-city/:cityId**

- **Descripción**: Lista barrios pertenecientes a una ciudad específica.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `cityId` (ObjectId de la ciudad)
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**: Misma estructura que GET /

#### **POST /**

- **Descripción**: Crea un nuevo barrio asociado a una ciudad.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "description": "string (requerido)",
  "cityId": "string (requerido, ObjectId de la ciudad)",
  "isActive": "boolean (opcional, default: true)"
}
```

- **Respuesta exitosa (201)**: Misma estructura que GET /:id

#### **PUT /:id**

- **Descripción**: Actualiza un barrio existente.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del barrio)
- **Cuerpo de la petición**:

```json
{
  "name": "string (opcional)",
  "description": "string (opcional)",
  "cityId": "string (opcional, ObjectId de la ciudad)",
  "isActive": "boolean (opcional)"
}
```

- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **DELETE /:id**

- **Descripción**: Elimina un barrio.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del barrio)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Barrio eliminado"
}
```

---

### Clientes (**/api/customers**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /**

- **Descripción**: Lista todos los clientes registrados en el sistema.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "customers": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "neighborhood": {
        "id": "string",
        "name": "string",
        "description": "string",
        "city": {
          "id": "string",
          "name": "string",
          "description": "string",
          "isActive": "boolean"
        },
        "isActive": "boolean"
      },
      "isActive": "boolean",
      "userId": "string"
    }
  ]
}
```

#### **GET /:id**

- **Descripción**: Obtiene un cliente específico por su ID.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del cliente)
- **Respuesta exitosa (200)**: Misma estructura que elemento individual de GET /

#### **GET /by-neighborhood/:neighborhoodId**

- **Descripción**: Lista clientes por barrio específico.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `neighborhoodId` (ObjectId del barrio)
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**: Misma estructura que GET /

#### **GET /by-email/:email**

- **Descripción**: Busca un cliente por su dirección de email.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `email` (email del cliente)
- **Respuesta exitosa (200)**: Misma estructura que elemento individual de GET /

#### **POST /**

- **Descripción**: Crea un nuevo cliente directamente (útil para cargas iniciales).
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "email": "string (requerido, formato email válido)",
  "phone": "string (requerido)",
  "address": "string (requerido)",
  "neighborhoodId": "string (requerido, ObjectId del barrio)",
  "isActive": "boolean (opcional, default: true)",
  "userId": "string (opcional, ObjectId del usuario asociado)"
}
```

- **Respuesta exitosa (201)**: Misma estructura que GET /:id

#### **PUT /:id**

- **Descripción**: Actualiza la información de un cliente.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del cliente)
- **Cuerpo de la petición**: Mismos campos que POST (todos opcionales)
- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **DELETE /:id**

- **Descripción**: Elimina un cliente y sus datos asociados.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del cliente)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Cliente eliminado"
}
```

---

### Direcciones (**/api/addresses**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

**Nota: Todos los endpoints requieren autenticación JWT**

#### **POST /**

- **Descripción**: Crea una nueva dirección de envío para el usuario autenticado.
- **Autenticación**: JWT requerido
- **Cuerpo de la petición**:

```json
{
  "recipientName": "string (requerido)",
  "phone": "string (requerido, formato válido)",
  "streetAddress": "string (requerido)",
  "selectedNeighborhoodId": "string (requerido, ObjectId del barrio)",
  "cityId": "string (opcional, ObjectId de la ciudad)",
  "postalCode": "string (opcional)",
  "additionalInfo": "string (opcional)",
  "isDefault": "boolean (opcional, default: false)",
  "alias": "string (opcional)"
}
```

- **Respuesta exitosa (201)**:

```json
{
  "id": "string",
  "customerId": "string",
  "recipientName": "string",
  "phone": "string",
  "streetAddress": "string",
  "neighborhood": {
    "id": "string",
    "name": "string",
    "description": "string",
    "city": {
      "id": "string",
      "name": "string",
      "description": "string",
      "isActive": "boolean"
    },
    "isActive": "boolean"
  },
  "city": {
    "id": "string",
    "name": "string",
    "description": "string",
    "isActive": "boolean"
  },
  "postalCode": "string",
  "additionalInfo": "string",
  "isDefault": "boolean",
  "alias": "string",
  "fullAddress": "string (dirección formateada)",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### **GET /**

- **Descripción**: Obtiene la lista de direcciones guardadas del usuario autenticado.
- **Autenticación**: JWT requerido
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "addresses": [
    {
      "id": "string",
      "customerId": "string",
      "recipientName": "string",
      "phone": "string",
      "streetAddress": "string",
      "neighborhood": {
        "id": "string",
        "name": "string",
        "description": "string",
        "city": {
          "id": "string",
          "name": "string",
          "description": "string",
          "isActive": "boolean"
        },
        "isActive": "boolean"
      },
      "city": {
        "id": "string",
        "name": "string",
        "description": "string",
        "isActive": "boolean"
      },
      "postalCode": "string",
      "additionalInfo": "string",
      "isDefault": "boolean",
      "alias": "string",
      "fullAddress": "string"
    }
  ]
}
```

#### **PUT /:id**

- **Descripción**: Actualiza una dirección específica del usuario autenticado.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `id` (ObjectId de la dirección)
- **Cuerpo de la petición**: Mismos campos que POST (todos opcionales)
- **Respuesta exitosa (200)**: Misma estructura que POST /

#### **DELETE /:id**

- **Descripción**: Elimina una dirección específica del usuario autenticado.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `id` (ObjectId de la dirección)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Dirección eliminada"
}
```

#### **PATCH /:id/default**

- **Descripción**: Marca una dirección como predeterminada para el usuario autenticado.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `id` (ObjectId de la dirección)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Dirección marcada como predeterminada",
  "address": {
    "id": "string",
    "isDefault": true
  }
}
```

---

### Carrito (**/api/cart**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

**Nota: Todos los endpoints requieren autenticación JWT**

#### **GET /**

- **Descripción**: Obtiene el contenido actual del carrito del usuario autenticado.
- **Autenticación**: JWT requerido
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "userId": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": ["string"],
    "img": "string"
  },
  "items": [
    {
      "product": {
        "id": "string",
        "name": "string",
        "description": "string",
        "price": "number",
        "priceWithTax": "number",
        "stock": "number",
        "category": {
          "id": "string",
          "name": "string",
          "description": "string"
        },
        "unit": {
          "id": "string",
          "name": "string",
          "description": "string"
        },
        "imgUrl": "string",
        "isActive": "boolean",
        "taxRate": "number",
        "tags": ["string"]
      },
      "quantity": "number",
      "priceAtTime": "number",
      "taxRate": "number",
      "unitPriceWithTax": "number",
      "subtotalWithTax": "number"
    }
  ],
  "totalItems": "number",
  "subtotalWithoutTax": "number",
  "totalTaxAmount": "number",
  "total": "number",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### **POST /items**

- **Descripción**: Añade un producto al carrito o incrementa su cantidad si ya existe.
- **Autenticación**: JWT requerido
- **Cuerpo de la petición**:

```json
{
  "productId": "string (requerido, ObjectId válido)",
  "quantity": "number (requerido, entero positivo)"
}
```

- **Respuesta exitosa (200)**: Misma estructura que GET /

#### **PUT /items/:productId**

- **Descripción**: Establece una cantidad específica para un producto en el carrito (si es 0, lo elimina).
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `productId` (ObjectId del producto)
- **Cuerpo de la petición**:

```json
{
  "quantity": "number (requerido, entero no negativo)"
}
```

- **Respuesta exitosa (200)**: Misma estructura que GET /

#### **DELETE /items/:productId**

- **Descripción**: Elimina un producto específico del carrito.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `productId` (ObjectId del producto)
- **Respuesta exitosa (200)**: Misma estructura que GET /

#### **DELETE /**

- **Descripción**: Elimina todos los ítems del carrito del usuario.
- **Autenticación**: JWT requerido
- **Respuesta exitosa (200)**:

```json
{
  "message": "Carrito vaciado",
  "cart": {
    "id": "string",
    "items": [],
    "totalItems": 0,
    "total": 0
  }
}
```

---

### Pedidos/Ventas (**/api/sales**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **POST /**

- **Descripción**: Crea un nuevo pedido. Puede ser usado por usuarios autenticados (usando su perfil y direcciones guardadas/nuevas) o por invitados (proporcionando datos de cliente y envío).
- **Autenticación**: Opcional (JWT requerido solo si se usa `selectedAddressId`)
- **Cuerpo de la petición**:

```json
{
  "items": [
    {
      "productId": "string (requerido)",
      "quantity": "number (requerido, > 0)",
      "unitPrice": "number (requerido, > 0)",
      "taxRate": "number (requerido, 0-100)"
    }
  ],
  "couponCode": "string (opcional)",
  "selectedAddressId": "string (opcional, requiere JWT)",
  "shippingAddress": {
    "street": "string (requerido si no hay selectedAddressId)",
    "number": "string (requerido si no hay selectedAddressId)",
    "neighborhood": "string (requerido si no hay selectedAddressId)",
    "city": "string (requerido si no hay selectedAddressId)",
    "zipCode": "string (opcional)",
    "details": "string (opcional)"
  },
  "customerData": {
    "name": "string (requerido si usuario no autenticado)",
    "email": "string (requerido si usuario no autenticado)",
    "phone": "string (opcional)"
  }
}
```

- **Respuesta exitosa (201)**:

```json
{
  "order": {
    "id": "string",
    "orderNumber": "string",
    "customer": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "items": [
      {
        "product": {
          "id": "string",
          "name": "string",
          "price": "number"
        },
        "quantity": "number",
        "unitPrice": "number",
        "taxRate": "number",
        "subtotal": "number"
      }
    ],
    "shippingAddress": {
      "street": "string",
      "number": "string",
      "neighborhood": "string",
      "city": "string",
      "zipCode": "string",
      "details": "string"
    },
    "subtotal": "number",
    "taxAmount": "number",
    "discountAmount": "number",
    "total": "number",
    "status": "string",
    "coupon": {
      "code": "string",
      "discountType": "string",
      "discountValue": "number"
    },
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

#### **GET /**

- **Descripción**: Lista todos los pedidos del sistema con paginación
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**:
  - `page`: número de página (opcional, default: 1)
  - `limit`: elementos por página (opcional, default: 10, max: 100)
- **Respuesta exitosa (200)**:

```json
{
  "orders": [
    {
      "id": "string",
      "orderNumber": "string",
      "customer": {
        "id": "string",
        "name": "string",
        "email": "string"
      },
      "total": "number",
      "status": "string",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

#### **GET /my-orders**

- **Descripción**: Lista el historial de pedidos del usuario autenticado
- **Autenticación**: JWT (usuario)
- **Query Parameters**:
  - `page`: número de página (opcional, default: 1)
  - `limit`: elementos por página (opcional, default: 10, max: 50)
- **Respuesta exitosa (200)**: Mismo formato que GET / pero solo pedidos del usuario

#### **GET /:id**

- **Descripción**: Obtiene los detalles completos de un pedido específico
- **Autenticación**: JWT (Admin o propietario del pedido)
- **Respuesta exitosa (200)**: Misma estructura que POST / con detalles completos

#### **PATCH /:id/status**

- **Descripción**: Actualiza el estado de un pedido
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**:

```json
{
  "status": "string (requerido: 'pending', 'processing', 'shipped', 'delivered', 'cancelled')"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "Order status updated successfully",
  "order": {
    "id": "string",
    "status": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

#### **GET /by-customer/:customerId**

- **Descripción**: Lista los pedidos de un cliente específico
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**: `page`, `limit` (igual que GET /)
- **Respuesta exitosa (200)**: Mismo formato que GET /

#### **POST /by-date-range**

- **Descripción**: Lista pedidos dentro de un rango de fechas
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**:

```json
{
  "startDate": "string (requerido, ISO date)",
  "endDate": "string (requerido, ISO date)",
  "page": "number (opcional, default: 1)",
  "limit": "number (opcional, default: 10)"
}
```

- **Respuesta exitosa (200)**: Mismo formato que GET /

#### **PUT /:id**

- **Descripción**: Actualiza completamente un pedido existente incluyendo items, detalles de envío, notas y cupones. Permite modificación total del pedido sin cambiar su estado.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `id` (ObjectId del pedido)
- **Cuerpo de la petición**:

```json
{
  "items": [
    {
      "productId": "string (opcional)",
      "quantity": "number (opcional, > 0)",
      "unitPrice": "number (opcional, > 0)",
      "taxRate": "number (opcional, 0-100)"
    }
  ],
  "shippingDetails": {
    "recipientName": "string (opcional)",
    "recipientPhone": "string (opcional)",
    "street": "string (opcional)",
    "number": "string (opcional)",
    "neighborhood": "string (opcional)",
    "city": "string (opcional)",
    "zipCode": "string (opcional)",
    "details": "string (opcional)"
  },
  "notes": "string (opcional)",
  "couponCode": "string (opcional)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "order": {
    "id": "string",
    "orderNumber": "string",
    "customer": {
      "id": "string",
      "name": "string",
      "email": "string"
    },
    "items": [
      {
        "product": {
          "id": "string",
          "name": "string",
          "price": "number"
        },
        "quantity": "number",
        "unitPrice": "number",
        "taxRate": "number",
        "subtotal": "number"
      }
    ],
    "shippingAddress": {
      "street": "string",
      "number": "string",
      "neighborhood": "string",
      "city": "string",
      "zipCode": "string",
      "details": "string"
    },
    "subtotal": "number",
    "taxAmount": "number",
    "discountAmount": "number",
    "total": "number",
    "status": "string",
    "coupon": {
      "code": "string",
      "discountType": "string",
      "discountValue": "number"
    },
    "notes": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

---

### Estados de Pedido (**/api/order-statuses**)

#### **GET /**

- **Descripción**: Lista todos los estados de pedido con paginación y filtros
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**:
  - `page`: número de página (opcional, default: 1)
  - `limit`: elementos por página (opcional, default: 10)
  - `activeOnly`: mostrar solo estados activos (opcional, default: false)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "orderStatuses": [
    {
      "id": "string",
      "code": "string",
      "name": "string", 
      "description": "string",
      "color": "string",
      "order": "number",
      "isActive": "boolean",
      "isDefault": "boolean",
      "canTransitionTo": ["array de ObjectIds"]
    }
  ]
}
```

#### **POST /**

- **Descripción**: Crea un nuevo estado de pedido
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**:

```json
{
  "code": "string (requerido, único)",
  "name": "string (requerido)",
  "description": "string (opcional)",
  "color": "string (opcional, hex color)",
  "order": "number (opcional)",
  "isActive": "boolean (opcional, default: true)",
  "isDefault": "boolean (opcional, default: false)",
  "canTransitionTo": ["array de códigos o IDs (opcional)"]
}
```

#### **GET /:id**

- **Descripción**: Obtiene un estado de pedido por su ID
- **Autenticación**: JWT + Rol de Administrador
- **Respuesta exitosa (200)**: Objeto del estado como en GET /

#### **PUT /:id**

- **Descripción**: Actualiza completamente un estado de pedido
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**: Mismo formato que POST /

#### **PATCH /:id/transitions**

- **Descripción**: Actualiza únicamente las transiciones permitidas de un estado de pedido específico
- **Autenticación**: JWT + Rol de Administrador
- **Parámetros de ruta**: `id` (ObjectId del estado)
- **Cuerpo de la petición**:

```json
{
  "canTransitionTo": [
    "string (código de estado o ObjectId)",
    "PROCESSING",
    "SHIPPED", 
    "675a1b2c3d4e5f6789012345"
  ]
}
```

- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string", 
  "color": "string",
  "order": "number",
  "isActive": "boolean",
  "isDefault": "boolean",
  "canTransitionTo": ["array de ObjectIds convertidos"]
}
```

- **Características especiales**:
  - Acepta tanto códigos de estado como ObjectIds en el array
  - Convierte automáticamente códigos a ObjectIds
  - Valida que todos los estados de destino existan
  - Previene autoreferencias (un estado no puede transicionar a sí mismo)
  - Mantiene todos los demás campos del estado sin modificar

#### **DELETE /:id**

- **Descripción**: Elimina un estado de pedido
- **Autenticación**: JWT + Rol de Administrador

#### **GET /active**

- **Descripción**: Lista solo los estados de pedido activos (ruta pública)
- **Autenticación**: No requerida
- **Query Parameters**: `page`, `limit` (igual que GET /)

#### **GET /default**

- **Descripción**: Obtiene el estado de pedido por defecto (ruta pública)
- **Autenticación**: No requerida

#### **GET /code/:code**

- **Descripción**: Obtiene un estado de pedido por su código (ruta pública)
- **Autenticación**: No requerida

#### **POST /validate-transition**

- **Descripción**: Valida si es posible una transición entre dos estados
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**:

```json
{
  "fromStatusId": "string (ObjectId requerido)",
  "toStatusId": "string (ObjectId requerido)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "isValid": "boolean"
}
```

---

### Métodos de Pago (**/api/payment-methods**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /active**

- **Descripción**: Obtiene todos los métodos de pago activos disponibles para los clientes.
- **Autenticación**: No requerida
- **Respuesta exitosa (200)**:

```json
[
  {
    "id": "string",
    "code": "string",
    "name": "string",
    "description": "string",
    "isActive": true,
    "defaultOrderStatusId": {
      "_id": "string",
      "code": "string",
      "name": "string",
      "description": "string",
      "color": "string"
    },
    "requiresOnlinePayment": "boolean",
    "allowsManualConfirmation": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
]
```

#### **GET /code/:code**

- **Descripción**: Busca un método de pago específico por su código único.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `code` (código del método de pago, ej: "CASH", "CREDIT_CARD")
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string",
  "isActive": "boolean",
  "defaultOrderStatusId": {
    "_id": "string",
    "code": "string",
    "name": "string",
    "description": "string",
    "color": "string"
  },
  "requiresOnlinePayment": "boolean",
  "allowsManualConfirmation": "boolean",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### **GET /**

- **Descripción**: Lista todos los métodos de pago (incluye activos e inactivos) con paginación.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "paymentMethods": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string",
      "isActive": "boolean",
      "defaultOrderStatusId": {
        "_id": "string",
        "code": "string",
        "name": "string",
        "description": "string",
        "color": "string"
      },      "requiresOnlinePayment": "boolean",
      "allowsManualConfirmation": "boolean",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

#### **GET /:id**

- **Descripción**: Obtiene los detalles de un método de pago específico por su ID.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del método de pago)
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string",
  "isActive": "boolean",
  "defaultOrderStatusId": {
    "_id": "string",
    "code": "string",
    "name": "string",
    "description": "string",
    "color": "string"
  },
  "requiresOnlinePayment": "boolean",
  "allowsManualConfirmation": "boolean",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### **POST /**

- **Descripción**: Crea un nuevo método de pago.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Cuerpo de la petición**:

```json
{
  "code": "string (requerido, único, ej: 'CASH', 'CREDIT_CARD')",
  "name": "string (requerido)",
  "description": "string (requerido)",
  "isActive": "boolean (requerido)",
  "defaultOrderStatusId": "string (requerido, ObjectId de estado de pedido existente)",
  "requiresOnlinePayment": "boolean (requerido)",
  "allowsManualConfirmation": "boolean (requerido)"
}
```

- **Respuesta exitosa (201)**: Misma estructura que GET /:id

#### **PUT /:id**

- **Descripción**: Actualiza un método de pago existente.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del método de pago)
- **Cuerpo de la petición**:

```json
{
  "code": "string (opcional)",
  "name": "string (opcional)",
  "description": "string (opcional)",
  "isActive": "boolean (opcional)",
  "defaultOrderStatusId": "string (opcional, ObjectId de estado de pedido existente)",
  "requiresOnlinePayment": "boolean (opcional)",
  "allowsManualConfirmation": "boolean (opcional)"
}
```

- **Respuesta exitosa (200)**: Misma estructura que GET /:id

#### **DELETE /:id**

- **Descripción**: Elimina un método de pago del sistema.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Parámetros de ruta**: `id` (ObjectId del método de pago)
- **Respuesta exitosa (200)**:

```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string",
  "isActive": "boolean",
  "defaultOrderStatusId": "string",
  "requiresOnlinePayment": "boolean",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### **Códigos de Métodos de Pago Comunes**

- `CASH`: Pago en efectivo
- `CREDIT_CARD`: Tarjeta de crédito
- `DEBIT_CARD`: Tarjeta de débito
- `BANK_TRANSFER`: Transferencia bancaria
- `PAYPAL`: PayPal
- `MERCADO_PAGO`: Mercado Pago

#### **Campos Especiales**

- **requiresOnlinePayment**: Indica si el método requiere procesamiento de pago online (true) o si es offline como efectivo (false)
- **allowsManualConfirmation**: Indica si el método de pago permite confirmación manual por parte del administrador (true) o si el pago se procesa automáticamente (false)
- **defaultOrderStatusId**: Estado de pedido que se asignará automáticamente cuando se use este método de pago
- **isActive**: Permite habilitar/deshabilitar métodos de pago sin eliminarlos del sistema

---

### Pagos (**/api/payments**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **POST /sale/:saleId**

- **Descripción**: Inicia el proceso de pago para una venta específica, creando una preferencia en Mercado Pago y un registro de pago local
- **Autenticación**: Opcional (dependiendo del flujo de implementación)
- **Parámetros de ruta**:
  - `saleId`: ID del pedido/venta (string, requerido)
- **Cuerpo de la petición**:

```json
{
  "paymentMethod": "string (opcional, default: 'mercadopago')",
  "returnUrl": "string (opcional, URL de retorno personalizada)"
}
```

- **Respuesta exitosa (201)**:

```json
{
  "payment": {
    "id": "string",
    "saleId": "string",
    "amount": "number",
    "currency": "string",
    "status": "pending",
    "providerId": "string",
    "preferenceId": "string",
    "createdAt": "string (ISO date)"
  },
  "preference": {
    "id": "string",
    "initPoint": "string (URL de pago de MercadoPago)",
    "sandboxInitPoint": "string (URL de pago en sandbox)"
  }
}
```

#### **POST /prueba/sale/:saleId**

- **Descripción**: Endpoint de prueba simplificado para crear preferencias de pago
- **Autenticación**: No requerida (solo para testing)
- **Parámetros de ruta**: `saleId` (string, requerido)
- **Respuesta exitosa (201)**: Misma estructura que POST /sale/:saleId

#### **GET /**

- **Descripción**: Lista todos los registros de pago guardados localmente
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**:
  - `page`: número de página (opcional, default: 1)
  - `limit`: elementos por página (opcional, default: 10)
  - `status`: filtrar por estado (opcional: 'pending', 'approved', 'rejected')
- **Respuesta exitosa (200)**:

```json
{
  "payments": [
    {
      "id": "string",
      "saleId": "string",
      "amount": "number",
      "currency": "string",
      "status": "string",
      "providerId": "string",
      "preferenceId": "string",
      "providerData": "object",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

#### **GET /:id**

- **Descripción**: Obtiene información detallada de un registro de pago local por su ID
- **Autenticación**: JWT + Rol de Administrador
- **Respuesta exitosa (200)**:

```json
{
  "payment": {
    "id": "string",
    "saleId": "string",
    "amount": "number",
    "currency": "string",
    "status": "string",
    "providerId": "string",
    "preferenceId": "string",
    "providerData": "object",
    "webhookData": "object",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

#### **GET /by-sale/:saleId**

- **Descripción**: Lista los registros de pago locales asociados a una venta específica
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**: `page`, `limit`
- **Respuesta exitosa (200)**: Mismo formato que GET /

#### **POST /verify**

- **Descripción**: Verifica el estado actual de un pago con Mercado Pago
- **Autenticación**: Opcional
- **Cuerpo de la petición**:

```json
{
  "paymentId": "string (requerido, ID local del pago)",
  "providerId": "string (opcional, ID del proveedor de pago)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "payment": {
    "id": "string",
    "status": "string",
    "statusDetail": "string",
    "amount": "number",
    "providerData": "object"
  },
  "isUpdated": "boolean"
}
```

#### **GET /preference/:preferenceId**

- **Descripción**: Obtiene el estado de una preferencia de Mercado Pago y del pago asociado
- **Autenticación**: Opcional
- **Respuesta exitosa (200)**:

```json
{
  "preference": {
    "id": "string",
    "status": "string",
    "items": "array",
    "payer": "object"
  },
  "payment": {
    "id": "string",
    "status": "string",
    "amount": "number"
  }
}
```

#### **GET /mercadopago/payments**

- **Descripción**: Consulta directamente a Mercado Pago los pagos realizados desde la cuenta asociada al Access Token
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**:
  - `page`: número de página (opcional)
  - `limit`: elementos por página (opcional)
  - `status`: filtrar por estado (opcional)
  - `dateFrom`: fecha desde (opcional, YYYY-MM-DD)
  - `dateTo`: fecha hasta (opcional, YYYY-MM-DD)
- **Respuesta exitosa (200)**:

```json
{
  "payments": "array (datos directos de MercadoPago)",
  "paging": {
    "total": "number",
    "limit": "number",
    "offset": "number"
  }
}
```

#### **GET /mercadopago/charges**

- **Descripción**: Consulta directamente a Mercado Pago los cobros recibidos en la cuenta asociada al Access Token
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**: Mismos que `/mercadopago/payments`
- **Respuesta exitosa (200)**: Formato similar a `/mercadopago/payments`

#### **POST /webhook**

- **Descripción**: Endpoint público que recibe notificaciones (webhooks) de Mercado Pago sobre cambios en el estado de los pagos
- **Autenticación**: No requerida (endpoint público)
- **Headers requeridos**:
  - `x-signature`: Firma de Mercado Pago para verificación
  - `x-request-id`: ID de la solicitud de Mercado Pago
- **Cuerpo de la petición**: Formato definido por Mercado Pago
- **Respuesta exitosa (200)**:

```json
{
  "message": "Webhook processed successfully"
}
```

#### **GET /success**

- **Descripción**: Callback público de Mercado Pago para pagos exitosos. Redirecciona al frontend.
- **Autenticación**: No requerida (endpoint público)
- **Query Parameters**:
  - `collection_id`: ID del pago en Mercado Pago
  - `collection_status`: Estado del pago
  - `preference_id`: ID de la preferencia
- **Respuesta**: Redirección 302 al frontend con parámetros

#### **GET /failure**

- **Descripción**: Callback público de Mercado Pago para pagos fallidos. Redirecciona al frontend.
- **Autenticación**: No requerida (endpoint público)
- **Query Parameters**: Mismos que `/success`
- **Respuesta**: Redirección 302 al frontend con parámetros de error

#### **GET /pending**

- **Descripción**: Callback público de Mercado Pago para pagos pendientes. Redirecciona al frontend.
- **Autenticación**: No requerida (endpoint público)
- **Query Parameters**: Mismos que `/success`
- **Respuesta**: Redirección 302 al frontend con parámetros de estado pendiente

---

### Cupones (**/api/coupons**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **GET /**

- **Descripción**: Lista todos los cupones del sistema con paginación
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**:
  - `page`: número de página (opcional, default: 1)
  - `limit`: elementos por página (opcional, default: 10)
  - `active`: filtrar por estado activo (opcional, boolean)
  - `expired`: incluir cupones expirados (opcional, boolean)
- **Respuesta exitosa (200)**:

```json
{
  "coupons": [
    {
      "id": "string",
      "code": "string",
      "description": "string",
      "discountType": "string (percentage | fixed)",
      "discountValue": "number",
      "minOrderAmount": "number",
      "maxDiscountAmount": "number",
      "usageLimit": "number",
      "usedCount": "number",
      "isActive": "boolean",
      "expirationDate": "string (ISO date)",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

#### **GET /:id**

- **Descripción**: Obtiene un cupón específico por su ID
- **Autenticación**: JWT + Rol de Administrador
- **Respuesta exitosa (200)**:

```json
{
  "coupon": {
    "id": "string",
    "code": "string",
    "description": "string",
    "discountType": "string (percentage | fixed)",
    "discountValue": "number",
    "minOrderAmount": "number",
    "maxDiscountAmount": "number",
    "usageLimit": "number",
    "usedCount": "number",
    "isActive": "boolean",
    "expirationDate": "string (ISO date)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)",
    "orders": [
      {
        "id": "string",
        "orderNumber": "string",
        "total": "number",
        "createdAt": "string (ISO date)"
      }
    ]
  }
}
```

#### **POST /**

- **Descripción**: Crea un nuevo cupón de descuento
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**:

```json
{
  "code": "string (requerido, único, 3-20 caracteres)",
  "description": "string (opcional)",
  "discountType": "string (requerido: 'percentage' | 'fixed')",
  "discountValue": "number (requerido, > 0)",
  "minOrderAmount": "number (opcional, >= 0)",
  "maxDiscountAmount": "number (opcional, > 0, solo para discountType: 'percentage')",
  "usageLimit": "number (opcional, >= 1)",
  "isActive": "boolean (opcional, default: true)",
  "expirationDate": "string (opcional, ISO date, debe ser futura)"
}
```

- **Respuesta exitosa (201)**:

```json
{
  "coupon": {
    "id": "string",
    "code": "string",
    "description": "string",
    "discountType": "string",
    "discountValue": "number",
    "minOrderAmount": "number",
    "maxDiscountAmount": "number",
    "usageLimit": "number",
    "usedCount": 0,
    "isActive": "boolean",
    "expirationDate": "string (ISO date)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

#### **PUT /:id**

- **Descripción**: Actualiza un cupón existente
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**: Mismo formato que POST / (todos los campos opcionales)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Coupon updated successfully",
  "coupon": {
    "id": "string",
    "code": "string",
    "description": "string",
    "discountType": "string",
    "discountValue": "number",
    "minOrderAmount": "number",
    "maxDiscountAmount": "number",
    "usageLimit": "number",
    "usedCount": "number",
    "isActive": "boolean",
    "expirationDate": "string (ISO date)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

#### **DELETE /:id**

- **Descripción**: Elimina o desactiva un cupón
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**:
  - `force`: eliminación definitiva (opcional, boolean, default: false)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Coupon deleted successfully"
}
```

#### **GET /validate/:code** *(Endpoint público futuro)*

- **Descripción**: Valida un código de cupón para uso público durante el checkout
- **Autenticación**: No requerida (endpoint público)
- **Query Parameters**:
  - `orderAmount`: monto del pedido para validar mínimo (opcional, number)
- **Respuesta exitosa (200)**:

```json
{
  "valid": "boolean",
  "coupon": {
    "code": "string",
    "description": "string",
    "discountType": "string",
    "discountValue": "number",
    "maxDiscountAmount": "number"
  },
  "discountAmount": "number (calculado basado en orderAmount)",
  "message": "string (descripción del estado de validación)"
}
```

- **Respuesta de error (400)**:

```json
{
  "valid": false,
  "message": "string (razón por la que el cupón no es válido)"
}
```

---

### Chatbot (**/api/chatbot**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **POST /query**

- **Descripción**: Envía una consulta al chatbot y obtiene una respuesta basada en RAG (Retrieval-Augmented Generation)
- **Autenticación**: No requerida (endpoint público)
- **Cuerpo de la petición**:

```json
{
  "message": "string (requerido, consulta del usuario)",
  "sessionId": "string (opcional, ID de sesión existente)",
  "userType": "string (opcional: 'customer' | 'owner', default: 'customer')",
  "context": {
    "customerId": "string (opcional)",
    "orderId": "string (opcional)",
    "productId": "string (opcional)"
  }
}
```

- **Respuesta exitosa (200)**:

```json
{
  "response": "string (respuesta generada por el chatbot)",
  "sessionId": "string (ID de sesión, nuevo o existente)",
  "sources": [
    {
      "type": "string (product | category | order | etc.)",
      "id": "string",
      "title": "string",
      "relevanceScore": "number (0-1)"
    }
  ],
  "timestamp": "string (ISO date)",
  "model": "string (modelo LLM utilizado)"
}
```

#### **GET /session/:sessionId**

- **Descripción**: Obtiene el historial de mensajes de una sesión específica de chat
- **Autenticación**: No requerida (endpoint público)
- **Query Parameters**:
  - `limit`: número máximo de mensajes (opcional, default: 50, max: 100)
- **Respuesta exitosa (200)**:

```json
{
  "session": {
    "id": "string",
    "userType": "string",
    "createdAt": "string (ISO date)",
    "lastActivity": "string (ISO date)",
    "messageCount": "number"
  },
  "messages": [
    {
      "id": "string",
      "role": "string (user | assistant)",
      "content": "string",
      "timestamp": "string (ISO date)",
      "sources": [
        {
          "type": "string",
          "id": "string",
          "title": "string"
        }
      ]
    }
  ]
}
```

#### **POST /session**

- **Descripción**: Crea una nueva sesión de chat
- **Autenticación**: No requerida (endpoint público)
- **Cuerpo de la petición**:

```json
{
  "userType": "string (opcional: 'customer' | 'owner', default: 'customer')",
  "metadata": {
    "customerId": "string (opcional)",
    "source": "string (opcional: 'web' | 'mobile' | 'widget')"
  }
}
```

- **Respuesta exitosa (201)**:

```json
{
  "session": {
    "id": "string",
    "userType": "string",
    "createdAt": "string (ISO date)",
    "expiresAt": "string (ISO date)",
    "metadata": "object"
  }
}
```

#### **GET /sessions**

- **Descripción**: Lista todas las sesiones de chat activas/recientes para administración
- **Autenticación**: JWT + Rol de Administrador
- **Query Parameters**:
  - `page`: número de página (opcional, default: 1)
  - `limit`: elementos por página (opcional, default: 20)
  - `userType`: filtrar por tipo de usuario (opcional)
  - `dateFrom`: fecha desde (opcional, ISO date)
  - `dateTo`: fecha hasta (opcional, ISO date)
- **Respuesta exitosa (200)**:

```json
{
  "sessions": [
    {
      "id": "string",
      "userType": "string",
      "messageCount": "number",
      "lastActivity": "string (ISO date)",
      "createdAt": "string (ISO date)",
      "isActive": "boolean",
      "metadata": "object"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  },
  "stats": {
    "totalSessions": "number",
    "activeSessions": "number",
    "avgMessagesPerSession": "number"
  }
}
```

#### **POST /generate-embeddings**

- **Descripción**: Dispara el proceso de generación/actualización de embeddings para la base de conocimiento del RAG
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**:

```json
{
  "forceRegenerate": "boolean (opcional, regenerar embeddings existentes)",
  "entities": "array (opcional, ['products', 'categories', 'orders', 'customers'])"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "Embeddings generation started",
  "taskId": "string",
  "estimatedTime": "string",
  "entities": "array (entidades a procesar)"
}
```

#### **POST /change-llm**

- **Descripción**: Cambia el modelo de lenguaje grande (LLM) que utiliza el chatbot
- **Autenticación**: JWT + Rol de Administrador
- **Cuerpo de la petición**:

```json
{
  "provider": "string (requerido: 'openai' | 'anthropic')",
  "model": "string (requerido, ej: 'gpt-4', 'claude-3-sonnet')",
  "config": {
    "temperature": "number (opcional, 0-1)",
    "maxTokens": "number (opcional)",
    "topP": "number (opcional, 0-1)"
  }
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "LLM configuration updated successfully",
  "previousConfig": {
    "provider": "string",
    "model": "string"
  },
  "newConfig": {
    "provider": "string",
    "model": "string",
    "config": "object"
  }
}
```

#### **GET /current-llm**

- **Descripción**: Muestra la configuración actual del LLM
- **Autenticación**: JWT + Rol de Administrador
- **Respuesta exitosa (200)**:

```json
{
  "currentLLM": {
    "provider": "string",
    "model": "string",
    "config": {
      "temperature": "number",
      "maxTokens": "number",
      "topP": "number"
    },
    "isActive": "boolean",
    "lastChanged": "string (ISO date)"
  },
  "availableModels": {
    "openai": ["gpt-4", "gpt-3.5-turbo"],
    "anthropic": ["claude-3-sonnet", "claude-3-haiku"]
  }
}
```

#### **GET /validate-embeddings**

- **Descripción**: Compara el número de documentos en la BD con los embeddings generados para verificar consistencia
- **Autenticación**: JWT + Rol de Administrador
- **Respuesta exitosa (200)**:

```json
{
  "validation": {
    "isConsistent": "boolean",
    "lastUpdate": "string (ISO date)",
    "entities": {
      "products": {
        "dbCount": "number",
        "embeddingsCount": "number",
        "isConsistent": "boolean",
        "lastSync": "string (ISO date)"
      },
      "categories": {
        "dbCount": "number",
        "embeddingsCount": "number",
        "isConsistent": "boolean",
        "lastSync": "string (ISO date)"
      }
    }
  },
  "recommendations": [
    "string (acciones recomendadas si hay inconsistencias)"
  ]
}
```

---

### Administración (**/api/admin**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

**(Todos los siguientes endpoints requieren autenticación JWT y rol ADMIN_ROLE)**

#### **Productos (**/api/admin/products**)**

##### **GET /**

- **Descripción**: Lista todos los productos (incluyendo activos e inactivos) con paginación
- **Query Parameters**:
  - `page`: número de página (opcional, default: 1)
  - `limit`: elementos por página (opcional, default: 10, max: 100)
  - `includeInactive`: incluir productos inactivos (opcional, boolean, default: true)
- **Respuesta exitosa (200)**:

```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "price": "number",
      "stock": "number",
      "category": {
        "id": "string",
        "name": "string"
      },
      "unit": {
        "id": "string",
        "name": "string"
      },
      "tags": [
        {
          "id": "string",
          "name": "string"
        }
      ],
      "img": "string",
      "isActive": "boolean",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **GET /search**

- **Descripción**: Realiza búsquedas y filtrados avanzados sobre todos los productos
- **Query Parameters**:
  - `q`: término de búsqueda (opcional, busca en nombre y descripción)
  - `categories`: IDs de categorías separados por coma (opcional)
  - `minPrice`: precio mínimo (opcional, number)
  - `maxPrice`: precio máximo (opcional, number)
  - `tags`: IDs de tags separados por coma (opcional)
  - `sortBy`: campo de ordenamiento (opcional: 'name', 'price', 'createdAt', 'stock')
  - `sortOrder`: orden ('asc' | 'desc', default: 'asc')
  - `page`, `limit`: paginación
- **Respuesta exitosa (200)**: Mismo formato que GET /

##### **GET /:id**

- **Descripción**: Obtiene los detalles completos de un producto específico por su ID
- **Respuesta exitosa (200)**:

```json
{
  "product": {
    "id": "string",
    "name": "string",
    "description": "string",
    "price": "number",
    "stock": "number",
    "category": {
      "id": "string",
      "name": "string",
      "description": "string"
    },
    "unit": {
      "id": "string",
      "name": "string",
      "abbreviation": "string"
    },
    "tags": [
      {
        "id": "string",
        "name": "string",
        "color": "string"
      }
    ],
    "img": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **POST /**

- **Descripción**: Crea un nuevo producto (permite subir imagen vía multipart/form-data)
- **Content-Type**: `multipart/form-data`
- **Campos del formulario**:
  - `name`: string (requerido)
  - `description`: string (opcional)
  - `price`: number (requerido, > 0)
  - `stock`: number (requerido, >= 0)
  - `categoryId`: string (requerido)
  - `unitId`: string (requerido)
  - `tags`: string (opcional, IDs separados por coma)
  - `image`: file (opcional, imagen del producto)
  - `isActive`: boolean (opcional, default: true)
- **Respuesta exitosa (201)**: Mismo formato que GET /:id

##### **PUT /:id**

- **Descripción**: Actualiza un producto existente (permite subir/reemplazar imagen)
- **Content-Type**: `multipart/form-data`
- **Campos del formulario**: Mismos que POST / (todos opcionales)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": "string",
    "name": "string",
    "price": "number",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina un producto y su imagen asociada
- **Respuesta exitosa (200)**:

```json
{
  "message": "Product deleted successfully"
}
```

##### **GET /by-category/:categoryId**

- **Descripción**: Lista productos (activos e inactivos) de una categoría específica
- **Query Parameters**: `page`, `limit`, `includeInactive`
- **Respuesta exitosa (200)**: Mismo formato que GET /

#### **Categorías (**/api/admin/categories**)**

##### **GET /**

- **Descripción**: Lista todas las categorías con paginación
- **Query Parameters**: `page`, `limit`
- **Respuesta exitosa (200)**:

```json
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "isActive": "boolean",
      "productCount": "number",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **GET /:id**

- **Descripción**: Obtiene una categoría por su ID
- **Respuesta exitosa (200)**:

```json
{
  "category": {
    "id": "string",
    "name": "string",
    "description": "string",
    "isActive": "boolean",
    "productCount": "number",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **POST /**

- **Descripción**: Crea una nueva categoría
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido, único)",
  "description": "string (opcional)",
  "isActive": "boolean (opcional, default: true)"
}
```

- **Respuesta exitosa (201)**: Mismo formato que GET /:id

##### **PUT /:id**

- **Descripción**: Actualiza una categoría existente
- **Cuerpo de la petición**: Mismos campos que POST / (todos opcionales)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Category updated successfully",
  "category": {
    "id": "string",
    "name": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina una categoría (verifica que no tenga productos asociados)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Category deleted successfully"
}
```

#### **Tags (**/api/admin/tags**)**

##### **GET /**

- **Descripción**: Lista todas las etiquetas con paginación
- **Query Parameters**: `page`, `limit`, `active` (filtrar por estado activo)
- **Respuesta exitosa (200)**:

```json
{
  "tags": [
    {
      "id": "string",
      "name": "string",
      "color": "string",
      "isActive": "boolean",
      "productCount": "number",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **POST /**

- **Descripción**: Crea una nueva etiqueta
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido, único)",
  "color": "string (opcional, código hex)",
  "isActive": "boolean (opcional, default: true)"
}
```

- **Respuesta exitosa (201)**:

```json
{
  "tag": {
    "id": "string",
    "name": "string",
    "color": "string",
    "isActive": "boolean",
    "createdAt": "string (ISO date)"
  }
}
```

##### **GET /:id**

- **Descripción**: Obtiene una etiqueta por ID
- **Respuesta exitosa (200)**: Mismo formato que POST /

##### **PUT /:id**

- **Descripción**: Actualiza una etiqueta
- **Cuerpo de la petición**: Mismos campos que POST / (todos opcionales)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Tag updated successfully",
  "tag": {
    "id": "string",
    "name": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina o desactiva una etiqueta
- **Respuesta exitosa (200)**:

```json
{
  "message": "Tag deleted successfully"
}
```

#### **Unidades (**/api/admin/units**)**

##### **GET /**

- **Descripción**: Lista todas las unidades de medida con paginación
- **Query Parameters**: `page`, `limit`
- **Respuesta exitosa (200)**:

```json
{
  "units": [
    {
      "id": "string",
      "name": "string",
      "abbreviation": "string",
      "productCount": "number",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **GET /:id**

- **Descripción**: Obtiene una unidad por su ID
- **Respuesta exitosa (200)**:

```json
{
  "unit": {
    "id": "string",
    "name": "string",
    "abbreviation": "string",
    "productCount": "number",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **POST /**

- **Descripción**: Crea una nueva unidad
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido, único)",
  "abbreviation": "string (requerido, único, 1-5 caracteres)"
}
```

- **Respuesta exitosa (201)**: Mismo formato que GET /:id

##### **PUT /:id**

- **Descripción**: Actualiza una unidad existente
- **Cuerpo de la petición**: Mismos campos que POST / (todos opcionales)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Unit updated successfully",
  "unit": {
    "id": "string",
    "name": "string",
    "abbreviation": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina una unidad (verifica que no tenga productos asociados)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Unit deleted successfully"
}
```

#### **Pedidos (**/api/admin/orders**)**

##### **GET /**

- **Descripción**: Lista todos los pedidos del sistema con paginación
- **Query Parameters**: `page`, `limit`, `status` (filtrar por estado)
- **Respuesta exitosa (200)**: Mismo formato que `/api/sales` GET /

##### **GET /:id**

- **Descripción**: Obtiene los detalles completos de un pedido específico
- **Respuesta exitosa (200)**: Mismo formato que `/api/sales` GET /:id

##### **PATCH /:id/status**

- **Descripción**: Actualiza el estado de un pedido
- **Cuerpo de la petición**:

```json
{
  "status": "string (requerido: 'pending', 'processing', 'shipped', 'delivered', 'cancelled')"
}
```

- **Respuesta exitosa (200)**: Mismo formato que `/api/sales` PATCH /:id/status

##### **GET /by-customer/:customerId**

- **Descripción**: Lista todos los pedidos de un cliente específico
- **Query Parameters**: `page`, `limit`
- **Respuesta exitosa (200)**: Mismo formato que GET /

##### **POST /by-date-range**

- **Descripción**: Lista pedidos dentro de un rango de fechas
- **Cuerpo de la petición**: Mismo formato que `/api/sales` POST /by-date-range
- **Respuesta exitosa (200)**: Mismo formato que GET /

##### **GET /dashboard-view**

- **Descripción**: Obtiene datos agrupados de pedidos para el panel de administración tipo Kanban
- **Respuesta exitosa (200)**:

```json
{
  "dashboard": {
    "totalOrders": "number",
    "ordersByStatus": {
      "pending": {
        "count": "number",
        "orders": [
          {
            "id": "string",
            "orderNumber": "string",
            "customer": {
              "name": "string",
              "email": "string"
            },
            "total": "number",
            "createdAt": "string (ISO date)"
          }
        ],
        "metadata": {
          "name": "string",
          "color": "string",
          "order": "number"
        }
      }
    },
    "stats": {
      "totalRevenue": "number",
      "averageOrderValue": "number",
      "completionRate": "number"
    }
  }
}
```

#### **Clientes (**/api/admin/customers**)**

##### **GET /**

- **Descripción**: Lista todos los clientes con paginación
- **Query Parameters**: `page`, `limit`, `search` (buscar por nombre/email)
- **Respuesta exitosa (200)**:

```json
{
  "customers": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "totalOrders": "number",
      "totalSpent": "number",
      "lastOrderDate": "string (ISO date)",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **GET /:id**

- **Descripción**: Obtiene un cliente por su ID con información detallada
- **Respuesta exitosa (200)**:

```json
{
  "customer": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "addresses": [
      {
        "id": "string",
        "street": "string",
        "number": "string",
        "neighborhood": "string",
        "city": "string",
        "isDefault": "boolean"
      }
    ],
    "orders": [
      {
        "id": "string",
        "orderNumber": "string",
        "total": "number",
        "status": "string",
        "createdAt": "string (ISO date)"
      }
    ],
    "stats": {
      "totalOrders": "number",
      "totalSpent": "number",
      "averageOrderValue": "number"
    },
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **POST /**

- **Descripción**: Crea un nuevo cliente directamente
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "email": "string (requerido, único)",
  "phone": "string (opcional)",
  "address": {
    "street": "string (opcional)",
    "number": "string (opcional)",
    "neighborhood": "string (opcional)",
    "city": "string (opcional)",
    "zipCode": "string (opcional)"
  }
}
```

- **Respuesta exitosa (201)**: Mismo formato que GET /:id

##### **PUT /:id**

- **Descripción**: Actualiza la información de un cliente
- **Cuerpo de la petición**: Mismos campos que POST / (todos opcionales)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Customer updated successfully",
  "customer": {
    "id": "string",
    "name": "string",
    "email": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina un cliente (considera impacto en pedidos/direcciones)
- **Query Parameters**:
  - `force`: eliminación definitiva (opcional, boolean)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Customer deleted successfully"
}
```

##### **GET /by-neighborhood/:neighborhoodId**

- **Descripción**: Lista clientes por barrio con paginación
- **Query Parameters**: `page`, `limit`
- **Respuesta exitosa (200)**: Mismo formato que GET /

##### **GET /by-email/:email**

- **Descripción**: Busca un cliente por su email
- **Respuesta exitosa (200)**: Mismo formato que GET /:id

#### **Usuarios (**/api/admin/users**)**

##### **GET /**

- **Descripción**: Lista todos los usuarios registrados
- **Query Parameters**: `page`, `limit`, `role` (filtrar por rol)
- **Respuesta exitosa (200)**:

```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": ["string"],
      "isActive": "boolean",
      "lastLogin": "string (ISO date)",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **PUT /:id**

- **Descripción**: Actualiza datos de un usuario (operación sensible para asignar/quitar rol ADMIN_ROLE)
- **Cuerpo de la petición**:

```json
{
  "name": "string (opcional)",
  "email": "string (opcional)",
  "role": "array (opcional, ['USER_ROLE'] | ['ADMIN_ROLE'] | ['USER_ROLE', 'ADMIN_ROLE'])",
  "isActive": "boolean (opcional)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "User updated successfully",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": ["string"],
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina una cuenta de usuario (considera si también se elimina el cliente asociado)
- **Respuesta exitosa (200)**:

```json
{
  "message": "User deleted successfully"
}
```

#### **Cupones (**/api/admin/coupons**)**

*Referirse a la sección [Cupones (/api/coupons)](#cupones-apicoupons) para documentación detallada de estos endpoints*

#### **Ciudades (**/api/admin/cities**)**

##### **GET /**

- **Descripción**: Lista todas las ciudades con paginación
- **Query Parameters**: `page`, `limit`, `search` (buscar por nombre)
- **Respuesta exitosa (200)**:

```json
{
  "cities": [
    {
      "id": "string",
      "name": "string",
      "neighborhoodCount": "number",
      "customerCount": "number",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **GET /:id**

- **Descripción**: Obtiene una ciudad por su ID
- **Respuesta exitosa (200)**:

```json
{
  "city": {
    "id": "string",
    "name": "string",
    "neighborhoods": [
      {
        "id": "string",
        "name": "string",
        "customerCount": "number"
      }
    ],
    "stats": {
      "neighborhoodCount": "number",
      "customerCount": "number"
    },
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **POST /**

- **Descripción**: Crea una nueva ciudad
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido, único)"
}
```

- **Respuesta exitosa (201)**: Mismo formato que GET /:id

##### **PUT /:id**

- **Descripción**: Actualiza una ciudad existente
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "City updated successfully",
  "city": {
    "id": "string",
    "name": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina una ciudad (considera impacto en barrios/direcciones)
- **Respuesta exitosa (200)**:

```json
{
  "message": "City deleted successfully"
}
```

##### **GET /by-name/:name**

- **Descripción**: Busca una ciudad por nombre exacto
- **Respuesta exitosa (200)**: Mismo formato que GET /:id

#### **Barrios (**/api/admin/neighborhoods**)**

##### **GET /**

- **Descripción**: Lista todos los barrios con paginación
- **Query Parameters**: `page`, `limit`, `cityId` (filtrar por ciudad)
- **Respuesta exitosa (200)**:

```json
{
  "neighborhoods": [
    {
      "id": "string",
      "name": "string",
      "city": {
        "id": "string",
        "name": "string"
      },
      "customerCount": "number",
      "createdAt": "string (ISO date)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

##### **GET /:id**

- **Descripción**: Obtiene un barrio por su ID
- **Respuesta exitosa (200)**:

```json
{
  "neighborhood": {
    "id": "string",
    "name": "string",
    "city": {
      "id": "string",
      "name": "string"
    },
    "customerCount": "number",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **POST /**

- **Descripción**: Crea un nuevo barrio
- **Cuerpo de la petición**:

```json
{
  "name": "string (requerido)",
  "cityId": "string (requerido)"
}
```

- **Respuesta exitosa (201)**: Mismo formato que GET /:id

##### **PUT /:id**

- **Descripción**: Actualiza un barrio existente
- **Cuerpo de la petición**:

```json
{
  "name": "string (opcional)",
  "cityId": "string (opcional)"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "Neighborhood updated successfully",
  "neighborhood": {
    "id": "string",
    "name": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

##### **DELETE /:id**

- **Descripción**: Elimina un barrio (considera impacto en clientes/direcciones)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Neighborhood deleted successfully"
}
```

##### **GET /by-city/:cityId**

- **Descripción**: Lista barrios por ciudad con paginación
- **Query Parameters**: `page`, `limit`
- **Respuesta exitosa (200)**: Mismo formato que GET /

---

### Cupones (**/api/coupons**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **POST /**

- **Descripción**: Crea un nuevo cupón de descuento.
- **Autenticación**: JWT requerido
- **Cuerpo de la petición**:

```json
{
  "code": "string (requerido, mínimo 3 caracteres, único)",
  "discountType": "string (requerido: 'PERCENTAGE' o 'FIXED')",
  "discountValue": "number (requerido, > 0)",
  "description": "string (opcional)",
  "isActive": "boolean (opcional, default: true)",
  "validFrom": "string (opcional, fecha ISO)",
  "validUntil": "string (opcional, fecha ISO)",
  "minPurchaseAmount": "number (opcional, monto mínimo de compra)",
  "usageLimit": "number (opcional, límite de usos)"
}
```

- **Respuesta exitosa (201)**:

```json
{
  "id": "string",
  "code": "string",
  "discountType": "string",
  "discountValue": "number",
  "description": "string",
  "isActive": "boolean",
  "validFrom": "string (ISO date)",
  "validUntil": "string (ISO date)",
  "minPurchaseAmount": "number",
  "usageLimit": "number",
  "usageCount": "number",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### **GET /**

- **Descripción**: Lista todos los cupones con paginación.
- **Autenticación**: JWT requerido
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
  - `activeOnly`: boolean (opcional, mostrar solo cupones activos)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "coupons": [
    {
      "id": "string",
      "code": "string",
      "discountType": "string",
      "discountValue": "number",
      "description": "string",
      "isActive": "boolean",
      "validFrom": "string (ISO date)",
      "validUntil": "string (ISO date)",
      "minPurchaseAmount": "number",
      "usageLimit": "number",
      "usageCount": "number",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

#### **GET /:id**

- **Descripción**: Obtiene los detalles de un cupón específico por su ID.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `id` (ObjectId del cupón)
- **Respuesta exitosa (200)**: Misma estructura que POST /

#### **PUT /:id**

- **Descripción**: Actualiza un cupón existente.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `id` (ObjectId del cupón)
- **Cuerpo de la petición**: Mismos campos que POST (todos opcionales)
- **Respuesta exitosa (200)**: Misma estructura que POST /

#### **DELETE /:id**

- **Descripción**: Elimina un cupón del sistema.
- **Autenticación**: JWT requerido
- **Parámetros de ruta**: `id` (ObjectId del cupón)
- **Respuesta exitosa (200)**:

```json
{
  "message": "Cupón eliminado exitosamente",
  "coupon": {
    "id": "string",
    "code": "string"
  }
}
```

#### **Tipos de Descuento**

- **PERCENTAGE**: Descuento porcentual (ej: 10% = 10)
- **FIXED**: Descuento de monto fijo (ej: $100 = 100)

#### **Validaciones**

- El código del cupón debe ser único en el sistema
- Para descuentos porcentuales, el valor no puede exceder 100
- La fecha `validFrom` debe ser anterior a `validUntil` si ambas están definidas
- El `minPurchaseAmount` debe ser positivo si se especifica
- El `usageLimit` debe ser positivo si se especifica

---

### Chatbot (**/api/chatbot**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

#### **POST /query**

- **Descripción**: Envía una consulta al chatbot para obtener una respuesta basada en RAG.
- **Autenticación**: No requerida
- **Cuerpo de la petición**:

```json
{
  "message": "string (requerido)",
  "sessionId": "string (opcional, para continuar una conversación)",
  "mode": "string (opcional: 'customer' o 'owner', default: 'customer')"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "response": "string (respuesta del chatbot)",
  "sessionId": "string (ID de la sesión de chat)",
  "metadata": {
    "llmUsed": "string",
    "processingTime": "number",
    "relevantDocuments": ["array de documentos relevantes"]
  }
}
```

#### **POST /session**

- **Descripción**: Crea una nueva sesión de chat.
- **Autenticación**: No requerida
- **Cuerpo de la petición**:

```json
{
  "mode": "string (opcional: 'customer' o 'owner', default: 'customer')"
}
```

- **Respuesta exitosa (201)**:

```json
{
  "sessionId": "string",
  "mode": "string",
  "createdAt": "string (ISO date)"
}
```

#### **GET /session/:sessionId**

- **Descripción**: Obtiene el historial de una sesión de chat específica.
- **Autenticación**: No requerida
- **Parámetros de ruta**: `sessionId` (ID de la sesión)
- **Respuesta exitosa (200)**:

```json
{
  "sessionId": "string",
  "mode": "string",
  "messages": [
    {
      "role": "string ('user' o 'assistant')",
      "content": "string",
      "timestamp": "string (ISO date)"
    }
  ],
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

#### **GET /sessions**

- **Descripción**: Lista todas las sesiones de chat (para administradores).
- **Autenticación**: JWT requerido (admin)
- **Query Parameters**:
  - `page`: number (opcional, default: 1)
  - `limit`: number (opcional, default: 10)
  - `mode`: string (opcional, filtrar por modo)
- **Respuesta exitosa (200)**:

```json
{
  "total": "number",
  "sessions": [
    {
      "sessionId": "string",
      "mode": "string",
      "messageCount": "number",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)"
    }
  ]
}
```

#### **POST /generate-embeddings**

- **Descripción**: Genera embeddings para la base de conocimiento del chatbot.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Respuesta exitosa (200)**:

```json
{
  "message": "Embeddings generados exitosamente",
  "stats": {
    "documentsProcessed": "number",
    "embeddingsGenerated": "number",
    "processingTime": "number"
  }
}
```

#### **GET /current-llm**

- **Descripción**: Obtiene información sobre el modelo LLM actualmente activo.
- **Autenticación**: No requerida
- **Respuesta exitosa (200)**:

```json
{
  "currentLLM": "string",
  "availableLLMs": ["array de LLMs disponibles"],
  "configuration": {
    "temperature": "number",
    "maxTokens": "number"
  }
}
```

#### **POST /change-llm**

- **Descripción**: Cambia el modelo LLM utilizado por el chatbot.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Cuerpo de la petición**:

```json
{
  "llmProvider": "string (requerido: 'openai' o 'anthropic')"
}
```

- **Respuesta exitosa (200)**:

```json
{
  "message": "LLM cambiado exitosamente",
  "newLLM": "string",
  "previousLLM": "string"
}
```

#### **GET /validate-embeddings**

- **Descripción**: Valida el estado de los embeddings en la base de conocimiento.
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Respuesta exitosa (200)**:

```json
{
  "isValid": "boolean",
  "embeddingCount": "number",
  "lastGenerated": "string (ISO date)",  "recommendations": ["array de recomendaciones"]
}
```

---

### Sistema de Monitoreo (**/api/monitoring**)

[⬆️ Volver a Enlaces Rápidos](#-enlaces-rápidos-a-endpoints)

El sistema de monitoreo proporciona información detallada sobre el estado y rendimiento de la aplicación, incluyendo métricas de MongoDB, Render.com, Cloudinary y alertas del sistema.

#### **Características del Sistema de Monitoreo:**

- **Salud General**: Endpoint público para verificar el estado básico del servicio
- **Monitoreo de MongoDB**: Métricas detalladas de uso de base de datos (requiere admin)
- **Monitoreo de Render**: Información sobre recursos del servidor (requiere admin) 
- **Monitoreo de Cloudinary**: Métricas de almacenamiento de imágenes y uso de transformaciones (requiere admin)
- **Reportes Completos**: Vista consolidada de todos los servicios (requiere admin)
- **Sistema de Alertas**: Notificaciones sobre problemas detectados (requiere admin)

#### **GET /health**

- **Descripción**: Obtiene el estado general de salud del sistema (público)
- **Autenticación**: No requerida
- **Respuesta exitosa (200)**:

```json
{
  "status": "healthy | degraded | unhealthy",
  "timestamp": "2025-06-16T12:20:00.000Z",
  "uptime": 1800,
  "services": {
    "mongodb": {
      "status": "connected | disconnected",
      "storageUsage": 15.2,
      "connections": 5,
      "recommendations": ["✅ MongoDB está funcionando correctamente"]
    },
    "render": {
      "status": "healthy | warning | critical",
      "hoursUsage": 14.93,
      "memoryUsage": 45.3,
      "recommendations": ["✅ Uso de Render dentro de límites normales"]
    },
    "cloudinary": {
      "status": "healthy | warning | critical",
      "storageUsage": 0.96,
      "bandwidthUsage": 0.6,
      "transformationsUsage": 5.0,
      "totalImages": 89,
      "recommendations": ["✅ Cloudinary funcionando correctamente"]
    }
  }
}
```

#### **GET /mongodb** 🔒

- **Descripción**: Obtiene métricas detalladas de MongoDB con medidas en formato humanamente legible
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Respuesta exitosa (200)**:

```json
{
  "data": {
    "cluster": "test-db",
    "storage": {
      "used": {
        "mb": 128.5,
        "gb": 0.13,
        "percentage": 25.1
      },
      "limits": {
        "maxStorage": 512,
        "maxStorageGB": 0.5,
        "maxConnections": 500
      },
      "remaining": {
        "mb": 383.5,
        "gb": 0.37
      }
    },
    "connections": {
      "current": 12,
      "percentage": 2.4,
      "limit": 500,
      "available": 488
    },
    "collections": [
      {
        "name": "products",
        "documentCount": 150,
        "storage": {
          "sizeMB": 43.5,
          "indexMB": 11.8,
          "totalMB": 55.3
        }
      },
      {
        "name": "users",
        "documentCount": 89,
        "storage": {
          "sizeMB": 22.4,
          "indexMB": 5.4,
          "totalMB": 27.8
        }
      }
    ],
    "status": "healthy",
    "recommendations": [
      "✅ MongoDB está funcionando dentro de los límites normales",
      "💡 Considere agregar índices para consultas frecuentes"
    ],
    "timestamp": "2025-06-16T12:20:00.000Z"
  },
  "service": "MongoDB Atlas",
  "timestamp": "2025-06-14T22:20:00.000Z"
}
```

#### **GET /render** 🔒

- **Descripción**: Obtiene métricas detalladas de Render.com
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Respuesta exitosa (200)**:

```json
{
  "data": {
    "service": "Render.com",
    "plan": "Free Tier",
    "currentInstance": {
      "environment": "production",
      "uptime": "2h 15m",
      "cpuUsage": 12,
      "memoryUsage": {
        "free": 8953,
        "total": 16310,
        "used": 7357,
        "percentage": 45
      }
    },
    "currentMonth": {
      "hoursUsed": 112,
      "hoursRemaining": 638,
      "percentage": 14.93
    },
    "limits": {
      "monthlyHours": 750,
      "sleepAfterMinutes": 15,
      "coldStartTime": "30-60 seconds"
    },
    "recommendations": [
      "✅ Uso de Render dentro de límites normales",
      "💡 Configure notificaciones cuando queden menos de 100 horas",
      "💡 Implemente métricas de uso para monitoreo continuo"
    ],
    "timestamp": "2025-06-14T22:20:00.000Z"
  },
  "service": "Render.com",
  "timestamp": "2025-06-14T22:20:00.000Z"
}
```

#### **GET /complete** 🔒

- **Descripción**: Obtiene un reporte completo de todos los servicios monitoreados con métricas detalladas en formato humanamente legible
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Respuesta exitosa (200)**:

```json
{
  "services": {
    "mongodb": {
      "status": "healthy",
      "storage": {
        "used": 128.5,
        "usedGB": 0.13,
        "percentage": 25.1,
        "limit": 512,
        "limitGB": 0.5,
        "remaining": 383.5,
        "remainingGB": 0.37
      },
      "connections": {
        "current": 12,
        "percentage": 2.4,
        "limit": 500
      },
      "recommendations": ["✅ MongoDB funcionando correctamente"],
      "alerts": []
    },
    "render": {
      "status": "healthy",
      "monthlyHours": {
        "used": 112.5,
        "percentage": 15.0,
        "remaining": 637.5,
        "limit": 750
      },
      "memory": {
        "used": 7.2,
        "free": 8.7,
        "total": 15.9,
        "percentage": 45.3
      },
      "trafficProjections": {
        "esporadico": {
          "hoursPerDay": 1.5,
          "monthlyTotal": 45,
          "remaining": 705,
          "status": "sobran"
        },
        "normal": {
          "hoursPerDay": 4,
          "monthlyTotal": 120,
          "remaining": 630,
          "status": "sobran"
        },
        "fuerte": {
          "hoursPerDay": 8,
          "monthlyTotal": 240,
          "remaining": 510,
          "status": "sobran"
        }
      },
      "recommendations": ["✅ Uso de Render dentro de límites normales"],
      "alerts": []
    },
    "cloudinary": {
      "status": "healthy",
      "storage": {
        "used": 245.8,
        "usedGB": 0.24,
        "percentage": 0.96,
        "limit": 25,
        "remaining": 24.76
      },
      "bandwidth": {
        "used": 156.2,
        "usedGB": 0.15,
        "percentage": 0.6,
        "limit": 25,
        "remaining": 24.85
      },
      "transformations": {
        "used": 1250,
        "percentage": 5.0,
        "limit": 25000,
        "remaining": 23750
      },
      "resources": {
        "totalImages": 89,
        "totalVideos": 3,
        "totalOthers": 12,
        "totalFiles": 104
      },
      "projections": {
        "storage": {
          "currentGB": 0.24,
          "projectedMonthlyGB": 0.24,
          "status": "OK"
        },
        "bandwidth": {
          "currentGB": 0.15,
          "projectedMonthlyGB": 0.45,
          "status": "OK"
        },
        "transformations": {
          "current": 1250,
          "projectedMonthly": 3750,
          "status": "OK"
        }
      },
      "recommendations": ["✅ Cloudinary funcionando correctamente"],
      "alerts": []
    }
  },
  "summary": {
    "overallStatus": "healthy",
    "criticalAlerts": [],
    "totalServices": 3,
    "healthyServices": 3,
    "degradedServices": 0,
    "unhealthyServices": 0
  },
  "timestamp": "2025-06-16T12:20:00.000Z"
}
```

#### **GET /alerts** 🔒

- **Descripción**: Obtiene alertas inteligentes del sistema con información detallada
- **Autenticación**: JWT + ADMIN_ROLE requerido
- **Características**:
  - **Alertas Multinivel**: Critical, Warning e Info
  - **Siempre Informativo**: Nunca devuelve respuesta vacía
  - **Estado del Sistema**: Incluye información cuando todo está saludable
  - **Umbrales Inteligentes**: Detecta problemas antes de que se vuelvan críticos

**Umbrales de Alertas:**
- **MongoDB Critical**: Almacenamiento > 85% O Conexiones > 450
- **MongoDB Warning**: Almacenamiento > 70% O Conexiones > 350  
- **Render Critical**: Uso mensual > 90% O Memoria > 90%
- **Render Warning**: Uso mensual > 75% O Memoria > 80%

**Respuesta cuando hay alertas críticas (200)**:
```json
{
  "alerts": [
    {
      "service": "MongoDB",
      "level": "critical",
      "message": "Almacenamiento al 88%",
      "action": "Limpiar datos o migrar a tier pago",
      "details": {
        "bytes": 471859200,
        "mb": 450,
        "percentage": 88
      }
    },
    {
      "service": "Render",
      "level": "warning",
      "message": "Horas usadas: 78%",
      "action": "Monitorear el uso",
      "details": {
        "hoursUsed": 585,
        "hoursRemaining": 165,
        "percentage": 78
      }
    }
  ],
  "timestamp": "2025-06-16T12:10:04.842Z",
  "totalAlerts": 2,
  "criticalCount": 1,
  "warningCount": 1,
  "infoCount": 0,
  "systemStatus": {
    "mongodb": "critical",
    "render": "warning",
    "overall": "critical"
  }
}
```

**Respuesta cuando el sistema está saludable (200)**:
```json
{
  "alerts": [
    {
      "service": "MongoDB",
      "level": "info",
      "message": "Sistema saludable - Almacenamiento: 0.02%",
      "action": "Continuar monitoreo regular",
      "details": {
        "status": "healthy",
        "storage": {
          "bytes": 80896,
          "mb": 0.08,
          "percentage": 0.02
        },
        "connections": 1
      }
    },
    {
      "service": "Render",
      "level": "info",
      "message": "Sistema saludable - Horas: 8.53%, Memoria: 70%",
      "action": "Continuar monitoreo regular",
      "details": {
        "status": "healthy",
        "monthly": {
          "hoursUsed": 64,
          "hoursRemaining": 686,
          "percentage": 8.53,
          "trafficProjections": {
            "esporadico": {
              "hoursPerDay": 1.5,
              "monthlyTotal": 45,
              "remaining": 705,
              "status": "sobran"
            },
            "normal": {
              "hoursPerDay": 4,
              "monthlyTotal": 120,
              "remaining": 630,
              "status": "sobran"
            },
            "fuerte": {
              "hoursPerDay": 8,
              "monthlyTotal": 240,
              "remaining": 510,
              "status": "sobran"
            }
          }
        },
        "memory": {
          "used": 11410,
          "free": 4900,
          "total": 16310,
          "percentage": 70
        }
      }
    }
  ],
  "timestamp": "2025-06-16T12:10:04.842Z",
  "totalAlerts": 2,
  "criticalCount": 0,
  "warningCount": 0,
  "infoCount": 2,
  "systemStatus": {
    "mongodb": "healthy",
    "render": "healthy",
    "overall": "healthy"
  }
}
```

#### **Notas sobre el Sistema de Monitoreo:**

- **🔒 Endpoints Protegidos**: Todos los endpoints excepto `/health` requieren autenticación JWT y rol `ADMIN_ROLE`
- **📊 Métricas en Tiempo Real**: Los datos se actualizan en tiempo real al momento de la consulta
- **🚨 Sistema de Alertas**: Detecta automáticamente problemas y genera recomendaciones
- **📱 Integración**: Diseñado para integrarse fácilmente con dashboards de monitoreo
- **⚡ Performance**: Optimizado para no impactar el rendimiento de la aplicación principal

#### **Casos de Uso:**

- **Dashboard de Administración**: Mostrar métricas en tiempo real
- **Health Checks**: Verificar estado del servicio desde balanceadores de carga
- **Alertas Proactivas**: Detectar problemas antes de que afecten a los usuarios
- **Planificación de Recursos**: Analizar tendencias de uso para escalar servicios
- **Troubleshooting**: Diagnosticar problemas de rendimiento o disponibilidad

---

##### **GET /by-city/:cityId**

- **Descripción**: Lista barrios por ciudad con paginación
- **Query Parameters**: `page`, `limit`
- **Respuesta exitosa (200)**: Mismo formato que GET /
