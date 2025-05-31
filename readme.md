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

**Endpoints Públicos (No requieren autenticación):**

* **GET /**: Lista todas las categorías (paginado). **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene una categoría por su ID. **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **POST /**: Crea una nueva categoría. **(🔒 Requiere JWT + Admin Role)**
  
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

* **PUT /:id**: Actualiza una categoría existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina una categoría. **(🔒 Requiere JWT + Admin Role)**

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

**Endpoints Públicos (No requieren autenticación):**

* **GET /**: Lista todas las unidades de medida (paginado). **(🔓 Público - Sin JWT)**
* **GET /:id**: Obtiene una unidad por su ID. **(🔓 Público - Sin JWT)**

**Endpoints de Administración:**

* **POST /**: Crea una nueva unidad. **(🔒 Requiere JWT + Admin Role)**
  
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

* **PUT /:id**: Actualiza una unidad existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina una unidad. **(🔒 Requiere JWT + Admin Role)**

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

### Clientes (**/api/customers**)

**Endpoints de Administración (Todos requieren JWT + Admin Role):**

* **GET /**: Lista todos los clientes (paginado). **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene un cliente por su ID. **(🔒 Requiere JWT + Admin Role)**
* **GET /by-neighborhood/:neighborhoodId**: Lista clientes por barrio (paginado). **(🔒 Requiere JWT + Admin Role)**
* **GET /by-email/:email**: Busca un cliente por su email. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo cliente directamente (útil para cargas iniciales o casos especiales). **(🔒 Requiere JWT + Admin Role)**
  
  **Nota:** El registro de usuario ya crea un cliente asociado automáticamente.
  
  **Estructura JSON requerida:**
  ```json
  {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "phone": "+54911234567",
    "documentType": "DNI",
    "documentNumber": "12345678",
    "birthDate": "1990-05-15",
    "isActive": true,
    "userId": "user_id_if_registered" // Opcional
  }
  ```

* **PUT /:id**: Actualiza la información de un cliente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina un cliente (y potencialmente sus datos asociados como direcciones). **(🔒 Requiere JWT + Admin Role)**

---

### Direcciones (**/api/addresses**) 

**Todos los endpoints requieren JWT (usuario autenticado):**

* **POST /**: Crea una nueva dirección de envío para el usuario autenticado. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "street": "Av. Corrientes 1234",
    "number": "1234",
    "floor": "5",
    "apartment": "B",
    "cityId": "city_string_id",
    "neighborhoodId": "neighborhood_string_id",
    "postalCode": "C1043AAZ",
    "reference": "Cerca del teatro San Martín",
    "isDefault": false
  }
  ```

* **GET /**: Obtiene la lista de direcciones guardadas por el usuario autenticado (paginado). **(🔒 Requiere JWT)**
* **PUT /:id**: Actualiza una dirección específica del usuario autenticado. **(🔒 Requiere JWT)**
* **DELETE /:id**: Elimina una dirección específica del usuario autenticado. **(🔒 Requiere JWT)**
* **PATCH /:id/default**: Marca una dirección específica como la predeterminada para el usuario autenticado. **(🔒 Requiere JWT)**

---

### Carrito (**/api/cart**)

**Todos los endpoints requieren JWT (usuario autenticado):**

* **GET /**: Obtiene el contenido actual del carrito del usuario autenticado. **(🔒 Requiere JWT)**
  
  **Respuesta JSON:**
  ```json
  {
    "items": [
      {
        "productId": "product_id",
        "productName": "Smartphone Galaxy S24",
        "quantity": 2,
        "unitPrice": 899.99,
        "taxRate": 0.21,
        "subtotal": 1799.98,
        "taxes": 377.996,
        "total": 2177.976
      }
    ],
    "summary": {
      "totalItems": 2,
      "subtotal": 1799.98,
      "taxes": 377.996,
      "total": 2177.976
    }
  }
  ```

* **POST /items**: Añade un producto (o incrementa su cantidad) al carrito. **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "productId": "product_id",
    "quantity": 1
  }
  ```

* **PUT /items/:productId**: Establece una cantidad específica para un producto en el carrito (si es 0, lo elimina). **(🔒 Requiere JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "quantity": 3
  }
  ```

* **DELETE /items/:productId**: Elimina un producto específico del carrito. **(🔒 Requiere JWT)**
* **DELETE /**: Elimina todos los ítems del carrito del usuario. **(🔒 Requiere JWT)**

---

### Pedidos/Ventas (**/api/sales**)

* **POST /**: Crea un nuevo pedido. Puede ser usado por usuarios autenticados (usando su perfil y direcciones guardadas/nuevas) o por invitados (proporcionando datos de cliente y envío). **(🔒 Requiere JWT si se usa selectedAddressId)**
  
  **Estructura JSON para usuario autenticado:**
  ```json
  {
    "selectedAddressId": "address_id", // Usar dirección guardada
    // O alternativamente:
    "shippingAddress": {
      "street": "Nueva calle 123",
      "number": "123",
      "cityId": "city_id",
      "neighborhoodId": "neighborhood_id"
    },
    "couponCode": "DESCUENTO10", // Opcional
    "paymentMethod": "mercadopago",
    "notes": "Entregar en horario de oficina"
  }
  ```

* **GET /**: Lista todos los pedidos del sistema (paginado). **(🔒 Requiere JWT + Admin Role)**
* **GET /my-orders**: Lista el historial de pedidos del usuario autenticado (paginado). **(🔒 Requiere JWT)**
* **GET /:id**: Obtiene los detalles de un pedido específico por su ID. **(🔒 Requiere JWT - Admin o dueño del pedido)**
* **PATCH /:id/status**: Actualiza el estado de un pedido (ej: a 'completed' o 'cancelled'). **(🔒 Requiere JWT + Admin Role)**
* **GET /by-customer/:customerId**: Lista los pedidos de un cliente específico (paginado). **(🔒 Requiere JWT + Admin Role)**
* **POST /by-date-range**: Lista pedidos dentro de un rango de fechas (paginado). **(🔒 Requiere JWT + Admin Role)**

---

### Pagos (**/api/payments**)

**Endpoints de Usuario:**

* **POST /sale/:saleId**: Inicia el proceso de pago para una venta específica, creando una preferencia en Mercado Pago y un registro de pago local. **(🔒 Puede requerir JWT según implementación)**
* **POST /prueba/sale/:saleId**: Endpoint de prueba simplificado para crear preferencias. **(🔒 Puede requerir JWT según implementación)**
* **POST /verify**: Verifica el estado actual de un pago con Mercado Pago usando el ID local y el ID del proveedor. **(🔒 Puede requerir JWT según implementación)**
* **GET /preference/:preferenceId**: Obtiene el estado de una preferencia de Mercado Pago y del pago asociado (si existe). **(🔒 Puede requerir JWT según implementación)**

**Endpoints Públicos (Callbacks de Mercado Pago):**

* **POST /webhook**: Recibe notificaciones (webhooks) de Mercado Pago sobre cambios en el estado de los pagos. **(🔓 Público - Webhook)**
* **GET /success**: Callback de Mercado Pago al que se redirige tras un pago exitoso. Redirecciona al frontend. **(🔓 Público - Callback)**
* **GET /failure**: Callback de Mercado Pago al que se redirige tras un pago fallido. Redirecciona al frontend. **(🔓 Público - Callback)**
* **GET /pending**: Callback de Mercado Pago al que se redirige para pagos pendientes. Redirecciona al frontend. **(🔓 Público - Callback)**

**Endpoints de Administración:**

* **GET /**: Lista todos los registros de pago guardados localmente (paginado). **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene información de un registro de pago local por su ID. **(🔒 Requiere JWT + Admin Role)**
* **GET /by-sale/:saleId**: Lista los registros de pago locales asociados a una venta (paginado). **(🔒 Requiere JWT + Admin Role)**
* **GET /mercadopago/payments**: Consulta directamente a Mercado Pago los pagos realizados desde la cuenta asociada al Access Token (paginado, filtros opcionales). **(🔒 Requiere JWT + Admin Role)**
* **GET /mercadopago/charges**: Consulta directamente a Mercado Pago los cobros recibidos en la cuenta asociada al Access Token (paginado, filtros opcionales). **(🔒 Requiere JWT + Admin Role)**

---

### Cupones (**/api/coupons**)

**Endpoints de Administración (Todos requieren JWT + Admin Role):**

* **GET /**: Lista todos los cupones (paginado). **(🔒 Requiere JWT + Admin Role)**
* **GET /:id**: Obtiene un cupón por su ID. **(🔒 Requiere JWT + Admin Role)**
* **POST /**: Crea un nuevo cupón. **(🔒 Requiere JWT + Admin Role)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "code": "DESCUENTO10",
    "description": "Descuento del 10% en toda la tienda",
    "discountType": "percentage", // "percentage" o "fixed"
    "discountValue": 10,
    "minOrderAmount": 100,
    "maxUsage": 100,
    "validFrom": "2024-01-01T00:00:00.000Z",
    "validUntil": "2024-12-31T23:59:59.999Z",
    "isActive": true
  }
  ```

* **PUT /:id**: Actualiza un cupón existente. **(🔒 Requiere JWT + Admin Role)**
* **DELETE /:id**: Elimina (o desactiva) un cupón. **(🔒 Requiere JWT + Admin Role)**

**Endpoints Públicos futuros:**

* **GET /validate/:code**: Valida un código de cupón. **(🔓 Posible endpoint público futuro)**

---

### Chatbot (**/api/chatbot**)

**Endpoints Públicos (No requieren autenticación):**

* **POST /query**: Envía una consulta al chatbot y obtiene una respuesta. **(🔓 Público - Sin JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "message": "¿Qué productos tienen en oferta?",
    "sessionId": "session_uuid_optional",
    "userType": "customer" // "customer" u "owner"
  }
  ```

* **GET /session/:sessionId**: Obtiene el historial de mensajes de una sesión específica. **(🔓 Público - Sin JWT)**
* **POST /session**: Crea una nueva sesión de chat. **(🔓 Público - Sin JWT)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "userType": "customer" // "customer" u "owner"
  }
  ```

**Endpoints de Administración:**

* **GET /sessions**: Lista todas las sesiones de chat activas/recientes. **(🔒 Requiere JWT + Admin Role)**
* **POST /generate-embeddings**: Dispara el proceso de generación/actualización de embeddings para la base de conocimiento del RAG. **(🔒 Requiere JWT + Admin Role)**
* **POST /change-llm**: Cambia el modelo de lenguaje grande (LLM) que utiliza el chatbot. **(🔒 Requiere JWT + Admin Role)**
  
  **Estructura JSON requerida:**
  ```json
  {
    "llmProvider": "openai" // "openai" o "anthropic"
  }
  ```

* **GET /current-llm**: Muestra cuál LLM está configurado actualmente. **(🔒 Requiere JWT + Admin Role)**
* **GET /validate-embeddings**: Compara el número de documentos en la BD con los embeddings generados para verificar consistencia. **(🔒 Requiere JWT + Admin Role)**

---

### Administración (**/api/admin**)

**Todos los endpoints bajo `/api/admin/` requieren JWT + Admin Role. 🔒**

#### Productos (**/api/admin/products**)

* **GET /**: Lista todos los productos (incluyendo activos e inactivos), con paginación. **(🔒 Requiere JWT + Admin Role)**
* **GET /search**: Realiza búsquedas y filtrados avanzados sobre todos los productos (activos e inactivos). **(🔒 Requiere JWT + Admin Role)**
  
  **Query Params:** `q`, `categories`, `minPrice`, `maxPrice`, `tags`, `sortBy`, `sortOrder`, `page`, `limit`.

* **GET /:id**: Obtiene los detalles completos de un producto específico por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea un nuevo producto (permite subir imagen vía **multipart/form-data** **con campo** **image** **y asignar** **tags**). **(🔒 Requiere JWT + Admin Role)**
  
    **Estructura JSON requerida (form-data):**
    ```json
    {
      "name": "Laptop Gaming ROG",
      "description": "Laptop gaming de alta gama con RTX 4070 y Ryzen 9",
      "price": 1899.99,
      "stock": 15,
      "categoryId": "category_id_here",
      "unitId": "unit_id_here", 
      "tags": "gaming,laptop,alta-gama", // O como array: ["gaming", "laptop", "alta-gama"]
      "taxRate": 0.21,
      "isActive": true,
      "image": "archivo_imagen.jpg" // Campo multipart/form-data
    }
    ```

  * **PUT /:id**: Actualiza un producto existente (permite subir/reemplazar imagen vía **multipart/form-data** **con campo** **image** **y modificar** **tags**). **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina un producto (y su imagen asociada). **(🔒 Requiere JWT + Admin Role)**
  * **GET /by-category/:categoryId**: Lista productos (activos e inactivos) de una categoría específica, con paginación. **(🔒 Requiere JWT + Admin Role)**
* **Categorías (**/api/admin/categories**)**

  * **GET /**: Lista todas las categorías (paginado). **(🔒 Requiere JWT + Admin Role)**
  * **GET /:id**: Obtiene una categoría por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea una nueva categoría. **(🔒 Requiere JWT + Admin Role)**
  
    **Estructura JSON requerida:**
    ```json
    {
      "name": "Electrodomésticos",
      "description": "Productos para el hogar y cocina",
      "isActive": true
    }
    ```

  * **PUT /:id**: Actualiza una categoría existente. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina una categoría. **(🔒 Requiere JWT + Admin Role)**
* **Tags (**/api/admin/tags**)**

  * **GET /**: Lista todas las etiquetas (activas e inactivas) con paginación. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea una nueva etiqueta. **(🔒 Requiere JWT + Admin Role)**
  
    **Estructura JSON requerida:**
    ```json
    {
      "name": "popular",
      "description": "Productos más vendidos y demandados",
      "isActive": true
    }
    ```

  * **GET /:id**: Obtiene una etiqueta por ID. **(🔒 Requiere JWT + Admin Role)**
  * **PUT /:id**: Actualiza una etiqueta. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina (o desactiva) una etiqueta. **(🔒 Requiere JWT + Admin Role)**
* **Unidades (**/api/admin/units**)**

  * **GET /**: Lista todas las unidades de medida (paginado). **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "units": [
        {
          "id": 1,
          "name": "Litro",
          "description": "Unidad de volumen del sistema métrico",
          "isActive": true
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **GET /:id**: Obtiene una unidad por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea una nueva unidad. **(🔒 Requiere JWT + Admin Role)**
  
    **Estructura JSON requerida:**
    ```json
    {
      "name": "Litro",
      "description": "Unidad de volumen del sistema métrico",
      "isActive": true
    }
    ```

  * **PUT /:id**: Actualiza una unidad existente. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina una unidad. **(🔒 Requiere JWT + Admin Role)**
* **Estados de Pedido (**/api/admin/order-statuses**)**

  * **GET /**: Lista todos los estados de pedido (activos e inactivos) con paginación. **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "orderStatuses": [
        {
          "id": "status_uuid_here",
          "code": "PENDING",
          "name": "Pendiente",
          "description": "Pedido recibido, pendiente de procesamiento",
          "color": "#FFC107",
          "order": 1,
          "isActive": true,
          "isDefault": true,
          "canTransitionTo": ["CONFIRMED", "CANCELLED"]
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **POST /**: Crea un nuevo estado de pedido. **(🔒 Requiere JWT + Admin Role)**
  
    **Estructura JSON requerida:**
    ```json
    {
      "name": "Enviado",
      "code": "SHIPPED",
      "description": "El pedido ha sido enviado al cliente",
      "color": "#4CAF50",
      "order": 4,
      "isActive": true,
      "isDefault": false,
      "canTransitionTo": ["DELIVERED", "RETURNED"]
    }
    ```

  * **GET /:id**: Obtiene un estado de pedido específico por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **PUT /:id**: Actualiza un estado de pedido existente. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina un estado de pedido (solo si no está siendo usado). **(🔒 Requiere JWT + Admin Role)**
  * **POST /validate-transition**: Valida si una transición entre estados es permitida. **(🔒 Requiere JWT + Admin Role)**
    
    **Estructura JSON requerida:**
    ```json
    {
      "fromStatusId": "status_uuid_here",
      "toStatusId": "status_uuid_here"
    }
    ```
* **Pedidos (**/api/admin/orders**)**

  * **GET /**: Lista todos los pedidos del sistema (paginado). **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "orders": [
        {
          "id": "order_uuid_here",
          "orderNumber": "ORD-2024-001",
          "customerId": "customer_uuid_here",
          "statusId": "status_uuid_here",
          "subtotal": 299.99,
          "taxAmount": 62.99,
          "total": 362.98,
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **GET /:id**: Obtiene los detalles completos de un pedido específico por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **PATCH /:id/status**: Actualiza el estado de un pedido (ej: a 'completed', 'shipped', 'cancelled'). **(🔒 Requiere JWT + Admin Role)**
    
    **Estructura JSON requerida:**
    ```json
    {
      "statusId": "new_status_uuid_here"
    }
    ```

  * **GET /by-customer/:customerId**: Lista todos los pedidos de un cliente específico (paginado). **(🔒 Requiere JWT + Admin Role)**
  * **POST /by-date-range**: Lista pedidos dentro de un rango de fechas (paginado). **(🔒 Requiere JWT + Admin Role)**
    
    **Estructura JSON requerida:**
    ```json
    {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
    ```
* **Clientes (**/api/admin/customers**)**

  * **GET /**: Lista todos los clientes (paginado). **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "customers": [
        {
          "id": "customer_uuid_here",
          "firstName": "Juan",
          "lastName": "Pérez",
          "email": "juan.perez@email.com",
          "phone": "+54 9 11 1234-5678",
          "isActive": true,
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **GET /:id**: Obtiene un cliente por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea un nuevo cliente directamente. **(🔒 Requiere JWT + Admin Role)**
    
    **Estructura JSON requerida:**
    ```json
    {
      "firstName": "María",
      "lastName": "González",
      "email": "maria.gonzalez@email.com",
      "phone": "+54 9 11 9876-5432",
      "isActive": true
    }
    ```

  * **PUT /:id**: Actualiza la información de un cliente. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina un cliente (considerar qué pasa con sus pedidos/direcciones). **(🔒 Requiere JWT + Admin Role)**
  * **GET /by-neighborhood/:neighborhoodId**: Lista clientes por barrio (paginado). **(🔒 Requiere JWT + Admin Role)**
  * **GET /by-email/:email**: Busca un cliente por su email. **(🔒 Requiere JWT + Admin Role)**
* **Usuarios (**/api/admin/users**)**

  * **GET /**: Lista todos los usuarios registrados. **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "users": [
        {
          "id": "user_uuid_here",
          "email": "admin@empresa.com",
          "role": "ADMIN_ROLE",
          "isActive": true,
          "customerId": "customer_uuid_here",
          "createdAt": "2024-01-15T10:30:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **PUT /:id**: Actualiza datos de un usuario (ej: asignar/quitar rol **ADMIN_ROLE**). **¡Operación sensible!** **(🔒 Requiere JWT + Admin Role)**
    
    **Estructura JSON requerida:**
    ```json
    {
      "role": "ADMIN_ROLE", // O "USER_ROLE"
      "isActive": true
    }
    ```

  * **DELETE /:id**: Elimina una cuenta de usuario (considerar si también se elimina el cliente asociado). **(🔒 Requiere JWT + Admin Role)**
* **Cupones (**/api/admin/coupons**)**

  * **GET /**: Lista todos los cupones (paginado). **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "coupons": [
        {
          "id": "coupon_uuid_here",
          "code": "DESCUENTO20",
          "name": "Descuento Enero",
          "description": "20% de descuento en todos los productos",
          "discountType": "percentage",
          "discountValue": 20,
          "minPurchaseAmount": 100,
          "maxDiscountAmount": 50,
          "expiresAt": "2024-01-31T23:59:59Z",
          "isActive": true,
          "usageCount": 15,
          "maxUsageCount": 100
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **GET /:id**: Obtiene un cupón por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea un nuevo cupón. **(🔒 Requiere JWT + Admin Role)**
    
    **Estructura JSON requerida:**
    ```json
    {
      "code": "VERANO2024",
      "name": "Descuento de Verano",
      "description": "15% de descuento para la temporada de verano",
      "discountType": "percentage",
      "discountValue": 15,
      "minPurchaseAmount": 50,
      "maxDiscountAmount": 25,
      "expiresAt": "2024-03-31T23:59:59Z",
      "isActive": true,
      "maxUsageCount": 200
    }
    ```

  * **PUT /:id**: Actualiza un cupón existente. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina (o desactiva) un cupón. **(🔒 Requiere JWT + Admin Role)**
* **Ciudades (**/api/admin/cities**)**

  * **GET /**: Lista todas las ciudades (paginado). **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "cities": [
        {
          "id": "city_uuid_here",
          "name": "Córdoba",
          "description": "Capital de la provincia de Córdoba",
          "isActive": true
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **GET /:id**: Obtiene una ciudad por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea una nueva ciudad. **(🔒 Requiere JWT + Admin Role)**
  
    **Estructura JSON requerida:**
    ```json
    {
      "name": "Córdoba",
      "description": "Capital de la provincia de Córdoba",
      "isActive": true
    }
    ```

  * **PUT /:id**: Actualiza una ciudad existente. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina una ciudad (considerar impacto en barrios/direcciones). **(🔒 Requiere JWT + Admin Role)**
  * **GET /by-name/:name**: Busca una ciudad por nombre exacto. **(🔒 Requiere JWT + Admin Role)**
* **Barrios (**/api/admin/neighborhoods**)**

  * **GET /**: Lista todos los barrios (paginado). **(🔒 Requiere JWT + Admin Role)**
    
    **Respuesta:**
    ```json
    {
      "neighborhoods": [
        {
          "id": "neighborhood_uuid_here",
          "name": "Nueva Córdoba",
          "description": "Barrio universitario y comercial",
          "cityId": "city_uuid_here",
          "isActive": true
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 10
    }
    ```

  * **GET /:id**: Obtiene un barrio por su ID. **(🔒 Requiere JWT + Admin Role)**
  * **POST /**: Crea un nuevo barrio. **(🔒 Requiere JWT + Admin Role)**
    
    **Estructura JSON requerida:**
    ```json
    {
      "name": "Cerro de las Rosas",
      "description": "Barrio residencial zona norte",
      "cityId": "city_uuid_here",
      "isActive": true
    }
    ```

  * **PUT /:id**: Actualiza un barrio existente. **(🔒 Requiere JWT + Admin Role)**
  * **DELETE /:id**: Elimina un barrio (considerar impacto en clientes/direcciones). **(🔒 Requiere JWT + Admin Role)**
  * **GET /by-city/:cityId**: Lista barrios por ciudad (paginado). **(🔒 Requiere JWT + Admin Role)**
