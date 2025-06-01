# StartUp E-commerce API (Backend)

**Este es el backend para una aplicación de E-commerce completa, construida con Node.js, TypeScript, Express y MongoDB. Incorpora características modernas como autenticación JWT, integración con pasarelas de pago, gestión de productos/clientes (con** **búsqueda y filtrado avanzados**, **gestión de direcciones**), un carrito de compras, sistema de cupones, un **panel de administración API** **y un chatbot inteligente basado en RAG (Retrieval-Augmented Generation).**

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
  * **Historial de pedidos para el usuario autenticado (**/my-orders**).**
  * **Búsqueda/listado de pedidos para administración.**
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
  * **Permite gestionar Productos, Categorías, Unidades,** **Tags**, Pedidos, Clientes, Ciudades, Barrios, Cupones y Usuarios.
* **Subida de Imágenes (Cloudinary):**

  * **Integración para subir/eliminar imágenes de productos.**
* **Notificaciones por Email (Nodemailer):**

  * **Envío de correos para restablecimiento de contraseña.**
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
  db.addresses.createIndex({ customerId: 1 })
  db.categories.createIndex({ name: 1 }, { unique: true }) // Asumiendo unicidad
  db.units.createIndex({ name: 1 }, { unique: true }) // Asumiendo unicidad
  db.cities.createIndex({ name: 1 }, { unique: true }) // Asumiendo unicidad
  db.neighborhoods.createIndex({ name: 1, city: 1 }, { unique: true }) // Índice compuesto
  db.coupons.createIndex({ code: 1 }, { unique: true }) // Asumiendo unicidad
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

## 💡 Decisiones Arquitectónicas y Destacados

* **TypeScript, Arquitectura en Capas, Inyección de Dependencias, DTOs, Mappers.**
* **Logging Detallado (Winston), Rate Limiting.**
* **Autenticación JWT y autorización por Roles.**
* **Búsqueda/Filtrado eficiente con MongoDB nativo (incluyendo filtro por** **tags**).
* **Gestión de Direcciones de Envío separada.**
* **Snapshot de Dirección en Pedidos.**
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
* **Notificaciones Adicionales (Email/Push).**
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

---

### Endpoints Generales

**Salud y Estado del Servidor:**

* **GET /**: Endpoint raíz que confirma que la API está funcionando. **(🔓 Público - Sin JWT)**

  **Respuesta JSON:**

  ```json
  {
    "message": "API E-commerce V1 - Running OK"
  }
  ```

* **GET /ping**: Endpoint de health check simple para monitoreo. **(🔓 Público - Sin JWT)**

  **Respuesta de texto:**

  ```
  pong
  ```

---

### Autenticación (**/api/auth**)

* **POST /register**: Registra un nuevo usuario en el sistema y crea un perfil de cliente básico asociado.
* **POST /login**: Autentica a un usuario existente usando email y contraseña, devuelve un token JWT. (Protegido por Rate Limit).
* **GET /**: Verifica un token JWT válido y devuelve los datos del usuario autenticado asociado a ese token. (Requiere JWT).
* **GET /all**: (Admin) Obtiene una lista de todos los usuarios registrados en el sistema. (Requiere JWT + Admin Role).
* **PUT /:id**: (Admin) Actualiza la información de un usuario específico (ej: nombre, roles). (Requiere JWT + Admin Role).
* **DELETE /:id**: (Admin) Elimina un usuario específico del sistema. (Requiere JWT + Admin Role).
* **POST /forgot-password**: Inicia el proceso de recuperación de contraseña para un email dado. Envía un email con un enlace de reseteo si el usuario existe. (Protegido por Rate Limit).
* **POST /reset-password**: Permite a un usuario establecer una nueva contraseña usando un token válido recibido por email. (Protegido por Rate Limit).

---

### Productos (**/api/products**)

**Endpoints Públicos (No requieren autenticación):**

* **GET /search**: Realiza búsquedas de productos por palabra clave (nombre/descripción) y permite filtrar por categorías, **etiquetas (tags)**, rango de precios, y ordenar los resultados. Devuelve resultados paginados y el conteo total. **(🔓 Público - Sin JWT)**

  * **Query Params:** **q**, **categories** **(string CSV),** **minPrice**, **maxPrice**, **tags** **(string CSV, ej:** **popular,oferta**)**,** **sortBy** **(**price**,** **createdAt**, **name**, **relevance**), **sortOrder** **(**asc**,** **desc**), **page**, **limit**.
* **GET /by-category/:categoryId**: Lista productos pertenecientes a una categoría específica, con paginación. **(🔓 Público - Sin JWT)**
* **GET /**: Lista todos los productos activos, con paginación. **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene los detalles de un producto específico por su ID. **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **POST /**: Crea un nuevo producto. Permite subir una imagen (campo **image** **en** **multipart/form-data**) y asignar **etiquetas (campo** **tags** **como string CSV o array en** **form-data**)**. **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida (form-data):**

  ```json
  {
    "name": "Smartphone Galaxy S24",
    "description": "Último modelo con cámara de 108MP y 5G",
    "price": 899.99,
    "stock": 50,
    "categoryId": "category_id_here",
    "unitId": "unit_id_here",
    "tags": "popular,nuevo,5g", // O como array: ["popular", "nuevo", "5g"]
    "taxRate": 0.21,
    "isActive": true,
    "image": "archivo_imagen.jpg" // Campo multipart/form-data
  }
  ```
* **PUT /:id**: Actualiza un producto existente. Permite subir/reemplazar una imagen (campo **image** **en** **multipart/form-data**) y modificar **etiquetas (campo** **tags** **como string CSV o array en** **form-data**, enviar vacío o null para borrar)**. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un producto (y su imagen asociada si existe). **(🔒 Requiere JWT + Admin Role)**

---

### Categorías (**/api/categories**)

> ⚠️ **ADVERTENCIA DE SEGURIDAD**: Todos los endpoints de categorías son actualmente públicos. Se recomienda proteger POST, PUT y DELETE con autenticación de administrador.

**Todos los Endpoints (Actualmente públicos - Sin autenticación):**

* **GET /**: Lista todas las categorías (paginado). **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene una categoría por su ID. **(🔓 Público - Sin JWT)**
* **POST /**: Crea una nueva categoría. **(🔓 Público - Sin JWT)** ⚠️ *Debería requerir Admin*

  **Estructura JSON requerida:**

  ```json
  {
    "name": "Tecnología",
    "description": "Productos relacionados con tecnología y gadgets",
    "isActive": true
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": 1,
    "name": "Tecnología",
    "description": "Productos relacionados con tecnología y gadgets",
    "isActive": true
  }
  ```
* **PUT /:id**: Actualiza una categoría existente. **(🔓 Público - Sin JWT)** ⚠️ *Debería requerir Admin*
* **DELETE /:id**: Elimina una categoría. **(🔓 Público - Sin JWT)** ⚠️ *Debería requerir Admin*

---

### Tags (Etiquetas) (**/api/tags**)

**Endpoints Públicos (No requieren autenticación):**

* **GET /**: Lista todas las etiquetas activas (paginado). **(🔓 Público - Sin JWT)**

  **Respuesta JSON:**

  ```json
  {
    "tags": [
      {
        "id": "tag_id_string",
        "name": "popular",
        "description": "Productos populares entre los usuarios",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
  ```

**Endpoints de Administración (**/api/admin/tags**):**

* **POST /**: Crea una nueva etiqueta. **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida:**

  ```json
  {
    "name": "oferta",
    "description": "Productos en oferta especial",
    "isActive": true
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": "generated_string_id",
    "name": "oferta",
    "description": "Productos en oferta especial",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
  ```
* **PUT /:id**: Actualiza una etiqueta existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina una etiqueta. **(🔒 Requiere JWT + Admin Role)**

---

### Unidades (**/api/units**)

> ⚠️ **ADVERTENCIA DE SEGURIDAD**: Todos los endpoints de unidades son actualmente públicos. Se recomienda proteger POST, PUT y DELETE con autenticación de administrador.

**Todos los Endpoints (Actualmente públicos - Sin autenticación):**

* **GET /**: Lista todas las unidades de medida (paginado). **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene una unidad por su ID. **(🔓 Público - Sin JWT)**
* **POST /**: Crea una nueva unidad. **(🔓 Público - Sin JWT)** ⚠️ *Debería requerir Admin*

  **Estructura JSON requerida:**

  ```json
  {
    "name": "Kilogramo",
    "description": "Unidad de masa del sistema internacional",
    "isActive": true
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": 1,
    "name": "Kilogramo",
    "description": "Unidad de masa del sistema internacional",
    "isActive": true
  }
  ```
* **PUT /:id**: Actualiza una unidad existente. **(🔓 Público - Sin JWT)** ⚠️ *Debería requerir Admin*
* **DELETE /:id**: Elimina una unidad. **(🔓 Público - Sin JWT)** ⚠️ *Debería requerir Admin*

---

### Estados de Pedido (**/api/order-statuses**)

**Endpoints Públicos (No requieren autenticación):**

* **GET /active**: Lista todos los estados de pedido activos (ordenados por order). **(🔓 Público - Sin JWT)**
* **GET /default**: Obtiene el estado de pedido por defecto del sistema. **(🔓 Público - Sin JWT)**
* **GET /code/:code**: Busca un estado de pedido específico por su código (ej: "PENDING", "CONFIRMED"). **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **GET /**: Lista todos los estados de pedido (activos e inactivos) con paginación. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo estado de pedido. **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida:**

  ```json
  {
    "code": "PREPARING",
    "name": "En Preparación", 
    "description": "El pedido está siendo preparado para envío",
    "color": "#FF9800",
    "order": 3,
    "isActive": true,
    "isDefault": false,
    "canTransitionTo": ["shipped_status_id", "cancelled_status_id"]
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": "generated_string_id",
    "code": "PREPARING",
    "name": "En Preparación",
    "description": "El pedido está siendo preparado para envío",
    "color": "#FF9800",
    "order": 3,
    "isActive": true,
    "isDefault": false,
    "canTransitionTo": ["shipped_status_id", "cancelled_status_id"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
  ```
* **PUT /:id**: Actualiza un estado de pedido existente. **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida:**

  ```json
  {
    "code": "PREPARING_UPDATED",
    "name": "En Preparación Actualizado",
    "description": "Descripción actualizada del estado",
    "color": "#FF9800",
    "order": 3,
    "isActive": true,
    "isDefault": false,
    "canTransitionTo": ["shipped_status_id", "cancelled_status_id"]
  }
  ```

  **Alternativamente, puedes usar códigos de estado en lugar de IDs para las transiciones:**

  ```json
  {
    "code": "PREPARING_UPDATED",
    "allowedTransitions": ["SHIPPED", "CANCELLED"]
  }
  ```

  **Notas importantes:**

  - El campo `code` se convierte automáticamente a mayúsculas.
  - Puedes usar tanto `canTransitionTo` (con ObjectIds) como `allowedTransitions` (con códigos de estado).
  - Los códigos de estado en `allowedTransitions` se convierten automáticamente a ObjectIds.
  - Todos los campos son opcionales; solo se actualizarán los campos proporcionados.
  - Si se proporciona un código duplicado, se retornará un error 400.
* **DELETE /:id**: Elimina un estado de pedido (solo si no está siendo usado por ningún pedido). **(🔒 Requiere JWT + Admin Role)**
* **POST /validate-transition**: Valida si una transición de estado es permitida. **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida:**

  ```json
  {
    "fromStatusId": "current_status_id",
    "toStatusId": "target_status_id"
  }
  ```

---

### Ciudades (**/api/cities**)

**Endpoints Públicos (No requieren autenticación):**

* **GET /**: Lista todas las ciudades (paginado). **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene una ciudad por su ID. **(🔓 Público - Sin JWT)**
* **GET /by-name/:name**: Busca una ciudad por su nombre exacto. **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **POST /**: Crea una nueva ciudad. **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida:**

  ```json
  {
    "name": "Buenos Aires",
    "description": "Capital de Argentina",
    "isActive": true
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": "generated_string_id",
    "name": "Buenos Aires",
    "description": "Capital de Argentina",
    "isActive": true
  }
  ```
* **PUT /:id**: Actualiza una ciudad existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina una ciudad. **(🔒 Requiere JWT + Admin Role)**

---

### Barrios (**/api/neighborhoods**)

**Endpoints Públicos (No requieren autenticación):**

* **GET /**: Lista todos los barrios (paginado). **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene un barrio por su ID. **(🔓 Público - Sin JWT)**
* **GET /by-city/:cityId**: Lista barrios pertenecientes a una ciudad específica (paginado). **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **POST /**: Crea un nuevo barrio, asociándolo a una ciudad. **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida:**

  ```json
  {
    "name": "Palermo",
    "description": "Barrio tradicional de Buenos Aires",
    "cityId": "city_string_id",
    "isActive": true
  }
  ```
* **PUT /:id**: Actualiza un barrio existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un barrio. **(🔒 Requiere JWT + Admin Role)**

---

### Pedidos/Ventas (**/api/sales**)

**Endpoints para Clientes (Requieren autenticación):**

* **POST /**: Crea un nuevo pedido (venta) para el usuario autenticado. **(🔒 Requiere JWT)**

  **Estructura JSON requerida:**

  ```json
  {
    "items": [
      {
        "productId": "product_id_string",
        "quantity": 2,
        "unitPrice": 29.99,
        "taxRate": 0.21
      }
    ],
    "address": {
      "street": "Av. Corrientes 1234",
      "city": "Buenos Aires",
      "neighborhood": "Centro",
      "zipCode": "C1043AAZ",
      "country": "Argentina",
      "additionalInfo": "Portero eléctrico"
    },
    "couponCode": "DESCUENTO10", // Opcional
    "notes": "Entregar después de las 18hs" // Opcional
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": "generated_order_id",
    "orderNumber": "ORD-2024-001234",
    "customer": {
      "id": "customer_id",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@email.com",
      "phone": "1123456789"
    },
    "items": [
      {
        "id": "item_id",
        "product": {
          "id": "product_id",
          "name": "Smartphone Galaxy S24",
          "description": "Último modelo con cámara de 108MP",
          "imageUrl": "https://cloudinary.com/image.jpg"
        },
        "quantity": 2,
        "unitPrice": 29.99,
        "taxRate": 0.21,
        "subtotal": 59.98,
        "taxAmount": 12.60,
        "total": 72.58
      }
    ],
    "shippingAddress": {
      "street": "Av. Corrientes 1234",
      "city": "Buenos Aires",
      "neighborhood": "Centro",
      "zipCode": "C1043AAZ",
      "country": "Argentina",
      "additionalInfo": "Portero eléctrico"
    },
    "status": {
      "id": "status_id",
      "code": "PENDING",
      "name": "Pendiente",
      "color": "#FFC107"
    },
    "subtotal": 59.98,
    "taxAmount": 12.60,
    "discountAmount": 6.00,
    "total": 66.58,
    "coupon": {
      "id": "coupon_id",
      "code": "DESCUENTO10",
      "discountType": "PERCENTAGE",
      "discountValue": 10
    },
    "notes": "Entregar después de las 18hs",
    "createdAt": "2024-01-15T14:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
  ```
* **GET /my-orders**: Lista todos los pedidos del usuario autenticado con paginación. **(🔒 Requiere JWT)**

  **Query Params:** **page** **(default: 1)**, **limit** **(default: 10)**

  **Respuesta JSON:**

  ```json
  {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "ORD-2024-001234",
        "status": {
          "id": "status_id",
          "code": "PENDING",
          "name": "Pendiente",
          "color": "#FFC107"
        },
        "itemsCount": 3,
        "total": 156.75,
        "createdAt": "2024-01-15T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
  ```
* **GET /:id**: Obtiene los detalles completos de un pedido específico (solo si pertenece al usuario autenticado). **(🔒 Requiere JWT)**

  **Respuesta JSON:** *(Mismo formato que la respuesta de POST /)*
* **PUT /:id/status**: Actualiza el estado de un pedido específico (solo si pertenece al usuario autenticado y la transición es válida). **(🔒 Requiere JWT)**

  **Estructura JSON requerida:**

  ```json
  {
    "statusId": "new_status_id"
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": "order_id",
    "orderNumber": "ORD-2024-001234",
    "status": {
      "id": "new_status_id",
      "code": "CONFIRMED",
      "name": "Confirmado",
      "color": "#4CAF50"
    },
    "updatedAt": "2024-01-15T15:45:00.000Z"
  }
  ```

---

### Administración de Pedidos (**/api/admin/orders**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todos los pedidos del sistema con filtros y paginación. **(🔒 Requiere JWT + Admin Role)**

  **Query Params:**

  - **page** **(default: 1)**, **limit** **(default: 10)**
  - **status** **(filtrar por código de estado, ej: PENDING, CONFIRMED)**
  - **customerId** **(filtrar por ID del cliente)**
  - **startDate**, **endDate** **(filtrar por rango de fechas, formato: YYYY-MM-DD)**
  - **minAmount**, **maxAmount** **(filtrar por rango de montos)**

  **Ejemplo:** **GET /api/admin/orders?status=PENDING&page=1&limit=10&startDate=2024-01-01&endDate=2024-01-31**

  **Respuesta JSON:**

  ```json
  {
    "orders": [
      {
        "id": "order_id",
        "orderNumber": "ORD-2024-001234",
        "customer": {
          "id": "customer_id",
          "firstName": "Juan",
          "lastName": "Pérez",
          "email": "juan.perez@email.com",
          "phone": "1123456789"
        },
        "status": {
          "id": "status_id",
          "code": "PENDING",
          "name": "Pendiente",
          "color": "#FFC107"
        },
        "itemsCount": 3,
        "subtotal": 149.97,
        "taxAmount": 31.49,
        "discountAmount": 15.00,
        "total": 166.46,
        "shippingAddress": {
          "street": "Av. Corrientes 1234",
          "city": "Buenos Aires",
          "neighborhood": "Centro",
          "zipCode": "C1043AAZ",
          "country": "Argentina"
        },
        "createdAt": "2024-01-15T14:30:00.000Z",
        "updatedAt": "2024-01-15T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "totalPages": 16
    }
  }
  ```
* **GET /:id**: Obtiene los detalles completos de cualquier pedido por su ID. **(🔒 Requiere JWT + Admin Role)**

  **Respuesta JSON:** *(Mismo formato detallado que POST /api/sales/)*
* **PUT /:id/status**: Actualiza el estado de cualquier pedido (sin restricciones de propiedad). **(🔒 Requiere JWT + Admin Role)**

  **Estructura JSON requerida:**

  ```json
  {
    "statusId": "new_status_id",
    "adminNotes": "Motivo del cambio de estado" // Opcional
  }
  ```

  **Respuesta JSON:**

  ```json
  {
    "id": "order_id",
    "orderNumber": "ORD-2024-001234",
    "status": {
      "id": "new_status_id",
      "code": "SHIPPED",
      "name": "Enviado",
      "color": "#2196F3"
    },
    "adminNotes": "Motivo del cambio de estado",
    "updatedAt": "2024-01-15T16:20:00.000Z"
  }
  ```
* **GET /by-customer/:customerId**: Lista todos los pedidos de un cliente específico. **(🔒 Requiere JWT + Admin Role)**

  **Query Params:** **page** **(default: 1)**, **limit** **(default: 10)**

  **Respuesta JSON:** *(Mismo formato que GET / pero filtrado por cliente)*
* **GET /by-date-range**: Lista pedidos en un rango de fechas específico. **(🔒 Requiere JWT + Admin Role)**

  **Query Params:**

  - **startDate** **(requerido, formato: YYYY-MM-DD)**
  - **endDate** **(requerido, formato: YYYY-MM-DD)**
  - **page** **(default: 1)**, **limit** **(default: 10)**

  **Ejemplo:** **GET /api/admin/orders/by-date-range?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20**

  **Respuesta JSON:** *(Mismo formato que GET / pero filtrado por fechas)*
* **DELETE /:id**: Elimina un pedido específico del sistema (⚠️ Acción irreversible). **(🔒 Requiere JWT + Admin Role)**

  **Respuesta JSON:**

  ```json
  {
    "message": "Pedido eliminado exitosamente",
    "deletedOrderId": "order_id",
    "deletedOrderNumber": "ORD-2024-001234"
  }
  ```

---

### Carrito de Compras (**/api/cart**)

**Todos los endpoints requieren autenticación JWT:**

* **GET /**: Obtiene el carrito del usuario autenticado. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:**
  ```json
  {
    "id": "cart_id",
    "customerId": "customer_id", 
    "items": [
      {
        "id": "item_id",
        "product": {
          "id": "product_id",
          "name": "Smartphone Galaxy S24",
          "description": "Último modelo con cámara de 108MP",
          "price": 899.99,
          "imageUrl": "https://cloudinary.com/image.jpg"
        },
        "quantity": 2,
        "unitPrice": 899.99,
        "taxRate": 0.21,
        "subtotal": 1799.98,
        "taxAmount": 377.99,
        "total": 2177.97
      }
    ],
    "itemsCount": 2,
    "subtotal": 1799.98,
    "taxAmount": 377.99,
    "total": 2177.97,
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
  ```

* **POST /items**: Añade un producto al carrito o actualiza la cantidad si ya existe. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "productId": "product_id_string",
    "quantity": 2
  }
  ```
  
  **Respuesta JSON:** *(Mismo formato que GET /)*

* **PUT /items/:productId**: Actualiza la cantidad de un producto específico en el carrito. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "quantity": 3
  }
  ```
  
  **Respuesta JSON:** *(Mismo formato que GET /)*

* **DELETE /items/:productId**: Elimina un producto específico del carrito. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:** *(Mismo formato que GET / sin el producto eliminado)*

* **DELETE /**: Vacía completamente el carrito del usuario. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:**
  ```json
  {
    "message": "Carrito vaciado exitosamente",
    "cart": {
      "id": "cart_id",
      "customerId": "customer_id",
      "items": [],
      "itemsCount": 0,
      "subtotal": 0,
      "taxAmount": 0,
      "total": 0
    }
  }
  ```

---

### Clientes (**/api/customers**)

**Endpoints Públicos (No requieren autenticación):**

* **GET /**: Lista todos los clientes (paginado). **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene un cliente por su ID. **(🔓 Público - Sin JWT)**
* **GET /by-email/:email**: Busca un cliente por su email. **(🔓 Público - Sin JWT)**
* **GET /by-neighborhood/:neighborhoodId**: Lista clientes de un barrio específico. **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **POST /**: Crea un nuevo cliente. **(🔒 Requiere JWT + Admin Role)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "phone": "1123456789",
    "documentType": "DNI",
    "documentNumber": "12345678",
    "neighborhoodId": "neighborhood_id_string",
    "isActive": true
  }
  ```
  
  **Respuesta JSON:**
  ```json
  {
    "id": "generated_customer_id",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "phone": "1123456789",
    "documentType": "DNI", 
    "documentNumber": "12345678",
    "neighborhood": {
      "id": "neighborhood_id",
      "name": "Centro",
      "city": {
        "id": "city_id",
        "name": "Buenos Aires"
      }
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
  ```

* **PUT /:id**: Actualiza un cliente existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un cliente. **(🔒 Requiere JWT + Admin Role)**

---

### Direcciones (**/api/addresses**)

**Todos los endpoints requieren autenticación JWT:**

* **GET /**: Lista todas las direcciones del usuario autenticado. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:**
  ```json
  {
    "addresses": [
      {
        "id": "address_id",
        "street": "Av. Corrientes 1234",
        "neighborhood": {
          "id": "neighborhood_id",
          "name": "Centro",
          "city": {
            "id": "city_id", 
            "name": "Buenos Aires"
          }
        },
        "zipCode": "C1043AAZ",
        "country": "Argentina",
        "additionalInfo": "Portero eléctrico",
        "isDefault": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
  ```

* **POST /**: Crea una nueva dirección para el usuario autenticado. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "street": "Av. Corrientes 1234",
    "neighborhoodId": "neighborhood_id_string",
    "zipCode": "C1043AAZ", 
    "country": "Argentina",
    "additionalInfo": "Portero eléctrico",
    "isDefault": false
  }
  ```
  
  **Respuesta JSON:** *(Misma estructura que el objeto en GET /)*

* **PUT /:id**: Actualiza una dirección específica del usuario autenticado. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:** *(Mismo formato que POST /)*
  
  **Respuesta JSON:** *(Misma estructura que el objeto en GET /)*

* **DELETE /:id**: Elimina una dirección específica del usuario autenticado. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:**
  ```json
  {
    "message": "Dirección eliminada exitosamente",
    "deletedAddressId": "address_id"
  }
  ```

* **PATCH /:id/default**: Marca una dirección como predeterminada para el usuario autenticado. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:** *(Misma estructura que el objeto en GET / con isDefault: true)*

---

### Cupones (**/api/coupons**)

**Todos los endpoints requieren autenticación JWT:**

* **GET /**: Lista todos los cupones (paginado). **(🔒 Requiere JWT)**
  
  **Query Params:** **page** **(default: 1)**, **limit** **(default: 10)**
  
  **Respuesta JSON:**
  ```json
  {
    "coupons": [
      {
        "id": "coupon_id",
        "code": "DESCUENTO10",
        "name": "Descuento 10%",
        "description": "Descuento del 10% en toda la tienda",
        "discountType": "PERCENTAGE",
        "discountValue": 10,
        "minimumPurchase": 100,
        "maxUses": 100,
        "usedCount": 25,
        "validFrom": "2024-01-01T00:00:00.000Z",
        "validUntil": "2024-12-31T23:59:59.000Z",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
  ```

* **GET /:id**: Obtiene un cupón específico por su ID. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:** *(Misma estructura que el objeto en GET /)*

* **POST /**: Crea un nuevo cupón. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "code": "DESCUENTO15",
    "name": "Descuento 15%",
    "description": "Descuento del 15% para clientes VIP",
    "discountType": "PERCENTAGE",
    "discountValue": 15,
    "minimumPurchase": 200,
    "maxUses": 50,
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-12-31T23:59:59.000Z",
    "isActive": true
  }
  ```
  
  **Respuesta JSON:** *(Misma estructura que el objeto en GET /)*

* **PUT /:id**: Actualiza un cupón existente. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:** *(Mismo formato que POST /)*
  
  **Respuesta JSON:** *(Misma estructura que el objeto en GET /)*

* **DELETE /:id**: Elimina un cupón o lo desactiva. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:**
  ```json
  {
    "message": "Cupón eliminado exitosamente",
    "deletedCouponId": "coupon_id"
  }
  ```

---

### Pagos (**/api/payments**)

**Endpoints Públicos (Webhooks y Callbacks):**

* **POST /webhook**: Procesa webhooks de Mercado Pago para actualizar estados de pago. **(🔓 Público - Sin JWT)**
* **GET /success**: Callback de éxito de Mercado Pago, redirige al frontend. **(🔓 Público - Sin JWT)**
* **GET /failure**: Callback de fallo de Mercado Pago, redirige al frontend. **(🔓 Público - Sin JWT)**
* **GET /pending**: Callback de pago pendiente de Mercado Pago, redirige al frontend. **(🔓 Público - Sin JWT)**

**Endpoints Protegidos (Gestión de Pagos):**

* **POST /sale/:saleId**: Crea una preferencia de pago para un pedido específico. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:**
  ```json
  {
    "id": "payment_id",
    "saleId": "sale_id",
    "preferenceId": "MP-preference-id",
    "externalReference": "unique-reference",
    "paymentUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=preference_id",
    "status": "PENDING",
    "amount": 199.99,
    "createdAt": "2024-01-15T14:30:00.000Z"
  }
  ```

* **GET /:id**: Obtiene los detalles de un pago específico. **(🔒 Requiere JWT)**
* **GET /by-sale/:saleId**: Lista todos los pagos de un pedido específico. **(🔒 Requiere JWT)**
* **GET /**: Lista todos los pagos (admin). **(🔒 Requiere JWT)**
* **POST /verify**: Verifica manualmente el estado de un pago. **(🔒 Requiere JWT)**
* **GET /preference/:preferenceId**: Verifica el estado de una preferencia de pago. **(🔒 Requiere JWT)**
* **GET /mercadopago/payments**: Lista pagos realizados en Mercado Pago del último año. **(🔒 Requiere JWT)**
* **GET /mercadopago/charges**: Lista cobros realizados en Mercado Pago del último año. **(🔒 Requiere JWT)**
* **POST /prueba/sale/:saleId**: Método de prueba simplificado para crear pagos. **(🔒 Requiere JWT)**

---

### Chatbot (**/api/chatbot**)

**Endpoints Públicos:**

* **POST /query**: Envía una consulta al chatbot y obtiene una respuesta. **(🔓 Público - Sin JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "message": "¿Qué productos tienen en oferta?",
    "sessionId": "session_uuid_optional",
    "mode": "client"
  }
  ```
  
  **Respuesta JSON:**
  ```json
  {
    "response": "Tenemos varios productos en oferta como smartphones, laptops...",
    "sessionId": "session_uuid",
    "timestamp": "2024-01-15T14:30:00.000Z"
  }
  ```

* **GET /session/:sessionId**: Obtiene el historial de una sesión de chat. **(🔓 Público - Sin JWT)**
* **POST /session**: Crea una nueva sesión de chat. **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **GET /sessions**: Lista todas las sesiones de chat (admin). **(🔒 Requiere JWT + Admin Role)**
* **POST /generate-embeddings**: Regenera los embeddings del sistema. **(🔒 Requiere JWT + Admin Role)**
* **POST /change-llm**: Cambia el modelo LLM utilizado. **(🔒 Requiere JWT + Admin Role)**
* **GET /current-llm**: Obtiene el modelo LLM actual. **(🔒 Requiere JWT + Admin Role)**
* **GET /validate-embeddings**: Valida los embeddings del sistema. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Productos (**/api/admin/products**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todos los productos para administración (incluyendo inactivos). **(🔒 Requiere JWT + Admin Role)**
* **GET /search**: Búsqueda avanzada de productos para admin. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene un producto específico para administración. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo producto con imagen requerida. **(🔒 Requiere JWT + Admin Role)**
  
  **Estructura multipart/form-data requerida:**
  ```
  name: "Smartphone Galaxy S24"
  description: "Último modelo con cámara de 108MP y 5G"
  price: 899.99
  stock: 50
  categoryId: "category_id_here"
  unitId: "unit_id_here"
  tags: "popular,nuevo,5g"
  taxRate: 0.21
  isActive: true
  image: [archivo de imagen requerido]
  ```

* **PUT /:id**: Actualiza un producto existente con imagen opcional. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un producto y su imagen asociada. **(🔒 Requiere JWT + Admin Role)**
* **GET /by-category/:categoryId**: Lista productos por categoría para admin. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Categorías (**/api/admin/categories**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todas las categorías para administración. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene una categoría específica. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea una nueva categoría. **(🔒 Requiere JWT + Admin Role)**
* **PUT /:id**: Actualiza una categoría existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina una categoría. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Unidades (**/api/admin/units**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todas las unidades para administración. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene una unidad específica. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea una nueva unidad. **(🔒 Requiere JWT + Admin Role)**
* **PUT /:id**: Actualiza una unidad existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina una unidad. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Clientes (**/api/admin/customers**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todos los clientes para administración. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene un cliente específico. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo cliente. **(🔒 Requiere JWT + Admin Role)**
* **PUT /:id**: Actualiza un cliente existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un cliente. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Usuarios (**/api/admin/users**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todos los usuarios del sistema. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene un usuario específico. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo usuario. **(🔒 Requiere JWT + Admin Role)**
* **PUT /:id**: Actualiza un usuario existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un usuario. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Cupones (**/api/admin/coupons**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todos los cupones para administración. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene un cupón específico. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo cupón. **(🔒 Requiere JWT + Admin Role)**
* **PUT /:id**: Actualiza un cupón existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un cupón. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Ciudades (**/api/admin/cities**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todas las ciudades para administración. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene una ciudad específica. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea una nueva ciudad. **(🔒 Requiere JWT + Admin Role)**
* **PUT /:id**: Actualiza una ciudad existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina una ciudad. **(🔒 Requiere JWT + Admin Role)**

---

### Administración de Barrios (**/api/admin/neighborhoods**)

**Todos los endpoints requieren JWT + Admin Role:**

* **GET /**: Lista todos los barrios para administración. **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene un barrio específico. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo barrio. **(🔒 Requiere JWT + Admin Role)**
* **PUT /:id**: Actualiza un barrio existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un barrio. **(🔒 Requiere JWT + Admin Role)**

---

## 🔐 Autenticación y Autorización

### JWT Token
Todos los endpoints marcados con 🔒 requieren incluir el token JWT en el header:
```
Authorization: Bearer <token>
```

### Roles de Usuario
- **USER_ROLE**: Usuario estándar registrado
- **ADMIN_ROLE**: Administrador con acceso completo

### Obtener Token
1. Registrarse: `POST /api/auth/register`
2. Iniciar sesión: `POST /api/auth/login`
3. Usar el token devuelto en el header `Authorization`

---

## ⚠️ Errores y Respuestas

### Códigos de Estado HTTP
- **200**: Éxito
- **201**: Recurso creado exitosamente
- **400**: Petición incorrecta (datos inválidos)
- **401**: No autorizado (token inválido/expirado)
- **403**: Prohibido (sin permisos suficientes)
- **404**: Recurso no encontrado
- **409**: Conflicto (recurso ya existe)
- **429**: Demasiadas peticiones (rate limit)
- **500**: Error interno del servidor

### Formato de Errores
```json
{
  "error": "Descripción del error",
  "details": "Información adicional (opcional)"
}
```

---

## 🔍 Notas de Seguridad

### ⚠️ **ADVERTENCIAS IMPORTANTES**:

1. **Categorías y Unidades**: Los endpoints POST, PUT y DELETE están actualmente **SIN PROTECCIÓN** y deberían requerir autenticación de administrador.

2. **Rate Limiting**: Solo está aplicado al endpoint de login (`/api/auth/login`) para prevenir ataques de fuerza bruta.

3. **Validación de Datos**: Asegúrese de validar todos los datos del cliente antes de procesar las peticiones.

---

## 📊 Resumen de Endpoints

### Total de Endpoints Documentados: **67**

**Públicos (🔓)**: 22 endpoints
- Autenticación: 1
- Productos: 3 
- Categorías: 5 ⚠️ (POST/PUT/DELETE deberían ser admin)
- Tags: 1
- Unidades: 5 ⚠️ (POST/PUT/DELETE deberían ser admin)
- Estados de Pedido: 3
- Ciudades: 1
- Barrios: 1
- Pagos (callbacks): 4
- Chatbot: 3
- General: 2

**Protegidos con JWT (🔒)**: 45 endpoints
- Autenticación: 2
- Carrito: 5
- Clientes: 7
- Direcciones: 5
- Cupones: 5
- Pagos: 8
- Pedidos/Ventas: 4
- Chatbot: 5
- Admin: 34

---

## 🚀 Para Empezar

1. **Instalar dependencias**: `npm install`
2. **Configurar variables de entorno**: Copiar `.env.example` a `.env`
3. **Iniciar MongoDB**: `docker-compose up -d mongo`
4. **Ejecutar en desarrollo**: `npm run dev`
5. **La API estará disponible en**: `http://localhost:3000`

---

## 📝 Changelog de Documentación

- **✅ Completado**: Documentación exhaustiva de todos los 67 endpoints de la API
- **✅ Identificadas**: Vulnerabilidades de seguridad en endpoints de Categorías y Unidades
- **✅ Agregado**: Documentación para Cart, Addresses, Customers, Coupons, Payments, Chatbot y Admin
- **✅ Corregido**: Documentación incorrecta de endpoints admin vs públicos
- **✅ Añadido**: Endpoints generales de salud del servidor
