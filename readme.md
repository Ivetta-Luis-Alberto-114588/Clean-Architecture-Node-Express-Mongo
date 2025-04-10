# StartUp E-commerce API (Backend)

Este es el backend para una aplicación de E-commerce completa, construida con Node.js, TypeScript, Express y MongoDB. Incorpora características modernas como autenticación JWT, integración con pasarelas de pago, gestión de productos/clientes (con **búsqueda y filtrado avanzados**, **gestión de direcciones**), un carrito de compras, sistema de cupones, un **panel de administración API** y un chatbot inteligente basado en RAG (Retrieval-Augmented Generation).

## ✨ Características Principales

* **Autenticación:**
  * Registro de usuarios (con creación automática de perfil de cliente).
  * Inicio de sesión con JWT (JSON Web Tokens).
  * Recuperación de contraseña (solicitud y reseteo por email).
  * Middleware para proteger rutas (`validateJwt`).
  * Middleware para verificación de roles (`checkRole`).
* **Gestión de Productos:**
  * CRUD completo para Productos, Categorías y Unidades de medida.
  * **Búsqueda y Filtrado Avanzado:** Búsqueda por texto (nombre, descripción), filtrado por categoría(s), rango de precios y ordenamiento configurable.
  * Asociación de productos con categorías y unidades.
  * Cálculo de precios con IVA.
  * Gestión de stock básica (decremento al crear pedido, restauración al cancelar).
* **Gestión de Clientes:**
  * CRUD completo para Clientes (con soporte para invitados).
  * Vinculación de Usuarios registrados con perfiles de Cliente.
  * CRUD completo para Ciudades y Barrios (asociados a ciudades).
  * **Gestión de Direcciones:**
    * Usuarios registrados pueden añadir, ver, actualizar y eliminar múltiples direcciones de envío.
    * Marcar una dirección como predeterminada.
    * Seleccionar dirección guardada durante el checkout.
    * Soporte para ingresar dirección nueva durante el checkout (registrados e invitados).
* **Carrito de Compras:**
  * Añadir/actualizar/eliminar ítems.
  * Obtener el carrito del usuario actual.
  * Vaciar carrito.
  * Almacena precios y tasas de IVA al momento de agregar el ítem.
* **Gestión de Pedidos (Ventas):**
  * Creación de pedidos usando dirección seleccionada, nueva o default.
  * Snapshot de la dirección de envío guardado en cada pedido.
  * Cálculo automático de subtotales, impuestos, descuentos y total.
  * Aplicación de cupones de descuento (porcentual o fijo).
  * Actualización de estado del pedido (pendiente, completado, cancelado).
  * Historial de pedidos para el usuario autenticado (`/my-orders`).
  * Búsqueda/listado de pedidos para administración.
* **Integración de Pagos (Mercado Pago):**
  * Creación de preferencias de pago.
  * Manejo de callbacks (success, failure, pending) con redirección al frontend.
  * Procesamiento de webhooks para actualizar estado de pago/pedido.
  * Verificación del estado del pago/preferencia.
  * Soporte para claves de idempotencia.
* **Sistema de Cupones:**
  * CRUD completo para Cupones.
  * Validaciones (fechas, monto mínimo, límite de uso).
  * Incremento automático del contador de uso.
* **Chatbot Inteligente (RAG):**
  * Modelo basado en Retrieval-Augmented Generation con `Transformers.js` y `Langchain`.
  * Generación/validación de embeddings para datos clave (Productos, Categorías, Clientes, etc.).
  * Integración con LLMs (OpenAI GPT, Anthropic Claude).
  * Modos Cliente/Dueño y gestión de sesiones.
* **Panel de Administración (API):**
  * Endpoints dedicados bajo `/api/admin` protegidos por rol `ADMIN_ROLE`.
  * Permite gestionar Productos, Categorías, Unidades, Pedidos, Clientes, Ciudades, Barrios, Cupones y Usuarios.
* **Subida de Imágenes (Cloudinary):**
  * Integración para subir/eliminar imágenes de productos.
* **Notificaciones por Email (Nodemailer):**
  * Envío de correos para restablecimiento de contraseña.
* **Infraestructura y Calidad:**
  * Arquitectura en capas (Domain, Infrastructure, Presentation).
  * DataSources, Repositories, Casos de Uso, Mappers, DTOs.
  * Manejo centralizado de errores (CustomError).
  * Logging avanzado (Winston).
  * Middlewares: Rate Limiting, Logging, Autenticación (JWT, Roles), Subida de archivos (Multer).
  * Variables de entorno centralizadas (`dotenv`, `env-var`).
  * CORS configurado.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express.js
* **Lenguaje:** TypeScript
* **Base de Datos:** MongoDB con Mongoose (Índices de Texto, Aggregation Pipeline)
* **Autenticación:** JWT (jsonwebtoken), bcryptjs
* **Pagos:** Mercado Pago SDK (vía API REST con Axios)
* **Chatbot:** Langchain.js, Transformers.js, OpenAI/Anthropic API
* **Subida de Imágenes:** Cloudinary, Multer
* **Emails:** Nodemailer
* **Logging:** Winston, winston-daily-rotate-file
* **Variables de Entorno:** dotenv, env-var
* **Rate Limiting:** express-rate-limit
* **Otros:** CORS, uuid

## 🏗️ Arquitectura

(Sin cambios)
El proyecto sigue una arquitectura en capas inspirada en principios de Clean Architecture:

1. **Domain:** ...
2. **Infrastructure:** ...
3. **Presentation:** ...

## 📋 Prerrequisitos

(Sin cambios)

* Node.js (v18+)
* npm o yarn
* MongoDB (v5+ recomendado)
* Cuenta de Cloudinary
* Cuenta de Mercado Pago
* Claves API para OpenAI y/o Anthropic
* Credenciales de un servicio de email

## 🚀 Instalación

1. **Clona el repositorio:**
   ```bash
   git clone <tu-repositorio-url>
   cd <nombre-del-directorio>
   ```
2. **Instala las dependencias:**
   ```bash
   npm install
   # o
   yarn install
   ```
3. **Configura las variables de entorno (`.env`):** (Asegúrate de tener todas las claves necesarias)
   ```env
   # Server
   PORT=3000
   NODE_ENV=development # development | production | test
   FRONTEND_URL=http://localhost:5173

   # MongoDB
   MONGO_URL=mongodb://localhost:27017/ecommerce_db # Ajusta si es necesario
   MONGO_DB_NAME=ecommerce_db

   # JWT
   JWT_SEED=TU_JWT_SEED_SECRETO

   # Mercado Pago
   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxx # Tu Access Token
   MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx # Tu Public Key

   # LLM APIs
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxx
   OPENAI_API_KEY=sk-xxxxxxxxxx

   # Webhook (Usa ngrok: https://ngrok.com/)
   URL_RESPONSE_WEBHOOK_NGROK=https://xxxx-xxxx-xxxx.ngrok-free.app # Reemplaza con tu URL de ngrok

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

   # Opcional: Log Level
   # LOG_LEVEL=debug
   ```
4. **(Importante) Crear índices de MongoDB:** Conéctate a tu shell de Mongo (`mongosh`) y ejecuta:
   ```bash
   use ecommerce_db # O el nombre de tu BD
   db.products.createIndex({ name: "text", description: "text" }, { weights: { name: 10, description: 5 }, name: "ProductTextIndex" })
   db.customers.createIndex({ email: 1 }, { unique: true })
   db.customers.createIndex({ userId: 1 }, { unique: true, sparse: true })
   db.users.createIndex({ email: 1 }, { unique: true })
   db.payments.createIndex({ externalReference: 1 }, { unique: true })
   db.payments.createIndex({ preferenceId: 1 }, { unique: true })
   db.addresses.createIndex({ customerId: 1 })
   // Revisa otros índices definidos en los modelos y créalos si es necesario
   ```

## ▶️ Ejecutar la Aplicación

1. **Modo Desarrollo:**
   ```bash
   npm run dev
   ```
2. **Compilar y Ejecutar en Producción:**
   ```bash
   npm run build
   npm start
   ```

La API estará en `http://localhost:PORT`.

## 🧪 Ejecutar Tests (Pendiente)

```bash
npm test
```

🌐 API Endpoints Principales

## 💡 Decisiones Arquitectónicas y Destacados

* **TypeScript, Arquitectura en Capas, Inyección de Dependencias, DTOs, Mappers.**
* **Logging Detallado (Winston), Rate Limiting.**
* **Autenticación JWT y autorización por Roles.**
* **Búsqueda/Filtrado eficiente con MongoDB nativo.**
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

### Autenticación (`/api/auth`)

* **`POST /register`**: Registra un nuevo usuario en el sistema y crea un perfil de cliente básico asociado.
* **`POST /login`**: Autentica a un usuario existente usando email y contraseña, devuelve un token JWT. (Protegido por Rate Limit).
* **`GET /`**: Verifica un token JWT válido y devuelve los datos del usuario autenticado asociado a ese token. (Requiere JWT).
* **`GET /all`**: (Admin) Obtiene una lista de todos los usuarios registrados en el sistema. (Requiere JWT + Admin Role).
* **`PUT /:id`**: (Admin) Actualiza la información de un usuario específico (ej: nombre, roles). (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina un usuario específico del sistema. (Requiere JWT + Admin Role).
* **`POST /forgot-password`**: Inicia el proceso de recuperación de contraseña para un email dado. Envía un email con un enlace de reseteo si el usuario existe. (Protegido por Rate Limit).
* **`POST /reset-password`**: Permite a un usuario establecer una nueva contraseña usando un token válido recibido por email. (Protegido por Rate Limit).

---

### Productos (`/api/products`)

* **`GET /search`**: Realiza búsquedas de productos por palabra clave (nombre/descripción) y permite filtrar por categorías, rango de precios, y ordenar los resultados. Devuelve resultados paginados y el conteo total.
  * **Query Params:** `q`, `categories`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `page`, `limit`.
* **`GET /by-category/:categoryId`**: Lista productos pertenecientes a una categoría específica, con paginación.
* **`GET /`**: Lista todos los productos activos, con paginación.
* **`GET /:id`**: Obtiene los detalles de un producto específico por su ID.
* **`POST /`**: (Admin) Crea un nuevo producto. Permite subir una imagen (campo `image` en `multipart/form-data`). (Requiere JWT + Admin Role).
* **`PUT /:id`**: (Admin) Actualiza un producto existente. Permite subir/reemplazar una imagen (campo `image` en `multipart/form-data`). (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina un producto (y su imagen asociada si existe). (Requiere JWT + Admin Role).

---

### Categorías (`/api/categories`)

* **`GET /`**: Lista todas las categorías (paginado).
* **`GET /:id`**: Obtiene una categoría por su ID.
* **`POST /`**: (Admin) Crea una nueva categoría. (Requiere JWT + Admin Role).
* **`PUT /:id`**: (Admin) Actualiza una categoría existente. (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina una categoría. (Requiere JWT + Admin Role).

---

### Unidades (`/api/units`)

* **`GET /`**: Lista todas las unidades de medida (paginado).
* **`GET /:id`**: Obtiene una unidad por su ID.
* **`POST /`**: (Admin) Crea una nueva unidad. (Requiere JWT + Admin Role).
* **`PUT /:id`**: (Admin) Actualiza una unidad existente. (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina una unidad. (Requiere JWT + Admin Role).

---

### Ciudades (`/api/cities`)

* **`GET /`**: Lista todas las ciudades (paginado).
* **`GET /:id`**: Obtiene una ciudad por su ID.
* **`GET /by-name/:name`**: Busca una ciudad por su nombre exacto.
* **`POST /`**: (Admin) Crea una nueva ciudad. (Requiere JWT + Admin Role).
* **`PUT /:id`**: (Admin) Actualiza una ciudad existente. (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina una ciudad. (Requiere JWT + Admin Role).

---

### Barrios (`/api/neighborhoods`)

* **`GET /`**: Lista todos los barrios (paginado).
* **`GET /:id`**: Obtiene un barrio por su ID.
* **`GET /by-city/:cityId`**: Lista barrios pertenecientes a una ciudad específica (paginado).
* **`POST /`**: (Admin) Crea un nuevo barrio, asociándolo a una ciudad. (Requiere JWT + Admin Role).
* **`PUT /:id`**: (Admin) Actualiza un barrio existente. (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina un barrio. (Requiere JWT + Admin Role).

---

### Clientes (`/api/customers`)

* **`GET /`**: (Admin) Lista todos los clientes (paginado). (Requiere JWT + Admin Role).
* **`GET /:id`**: (Admin) Obtiene un cliente por su ID. (Requiere JWT + Admin Role).
* **`GET /by-neighborhood/:neighborhoodId`**: (Admin) Lista clientes por barrio (paginado). (Requiere JWT + Admin Role).
* **`GET /by-email/:email`**: (Admin) Busca un cliente por su email. (Requiere JWT + Admin Role).
* **`POST /`**: (Admin) Crea un nuevo cliente directamente (útil para cargas iniciales o casos especiales). (Requiere JWT + Admin Role). *Nota: El registro de usuario ya crea un cliente asociado.*
* **`PUT /:id`**: (Admin) Actualiza la información de un cliente. (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina un cliente (y potencialmente sus datos asociados como direcciones). (Requiere JWT + Admin Role).

---

### Direcciones (`/api/addresses`) (Requieren JWT)

* **`POST /`**: Crea una nueva dirección de envío para el usuario autenticado.
* **`GET /`**: Obtiene la lista de direcciones guardadas por el usuario autenticado (paginado).
* **`PUT /:id`**: Actualiza una dirección específica del usuario autenticado.
* **`DELETE /:id`**: Elimina una dirección específica del usuario autenticado.
* **`PATCH /:id/default`**: Marca una dirección específica como la predeterminada para el usuario autenticado.

---

### Carrito (`/api/cart`) (Requieren JWT)

* **`GET /`**: Obtiene el contenido actual del carrito del usuario autenticado.
* **`POST /items`**: Añade un producto (o incrementa su cantidad) al carrito.
* **`PUT /items/:productId`**: Establece una cantidad específica para un producto en el carrito (si es 0, lo elimina).
* **`DELETE /items/:productId`**: Elimina un producto específico del carrito.
* **`DELETE /`**: Elimina todos los ítems del carrito del usuario.

---

### Pedidos/Ventas (`/api/sales`)

* **`POST /`**: Crea un nuevo pedido. Puede ser usado por usuarios autenticados (usando su perfil y direcciones guardadas/nuevas) o por invitados (proporcionando datos de cliente y envío).
* **`GET /`**: (Admin) Lista todos los pedidos del sistema (paginado). (Requiere JWT + Admin Role).
* **`GET /my-orders`**: Lista el historial de pedidos del usuario autenticado (paginado). (Requiere JWT).
* **`GET /:id`**: Obtiene los detalles de un pedido específico por su ID. (Requiere JWT + Admin Role o ser el dueño).
* **`PATCH /:id/status`**: (Admin) Actualiza el estado de un pedido (ej: a 'completed' o 'cancelled'). (Requiere JWT + Admin Role).
* **`GET /by-customer/:customerId`**: (Admin) Lista los pedidos de un cliente específico (paginado). (Requiere JWT + Admin Role).
* **`POST /by-date-range`**: (Admin) Lista pedidos dentro de un rango de fechas (paginado). (Requiere JWT + Admin Role).

---

### Pagos (`/api/payments`)

* **`POST /sale/:saleId`**: Inicia el proceso de pago para una venta específica, creando una preferencia en Mercado Pago y un registro de pago local. (Puede requerir JWT).
* **`POST /prueba/sale/:saleId`**: Endpoint de prueba simplificado para crear preferencias.
* **`GET /`**: (Admin) Lista todos los registros de pago guardados localmente (paginado). (Requiere JWT + Admin Role).
* **`GET /:id`**: (Admin) Obtiene información de un registro de pago local por su ID. (Requiere JWT + Admin Role).
* **`GET /by-sale/:saleId`**: (Admin) Lista los registros de pago locales asociados a una venta (paginado). (Requiere JWT + Admin Role).
* **`POST /verify`**: Verifica el estado actual de un pago con Mercado Pago usando el ID local y el ID del proveedor. (Puede requerir JWT).
* **`GET /preference/:preferenceId`**: Obtiene el estado de una preferencia de Mercado Pago y del pago asociado (si existe). (Puede requerir JWT).
* **`GET /mercadopago/payments`**: (Admin) Consulta directamente a Mercado Pago los pagos *realizados* desde la cuenta asociada al Access Token (paginado, filtros opcionales). (Requiere JWT + Admin Role).
* **`GET /mercadopago/charges`**: (Admin) Consulta directamente a Mercado Pago los *cobros recibidos* en la cuenta asociada al Access Token (paginado, filtros opcionales). (Requiere JWT + Admin Role).
* **`POST /webhook`**: **Endpoint Público.** Recibe notificaciones (webhooks) de Mercado Pago sobre cambios en el estado de los pagos.
* **`GET /success`**: **Endpoint Público.** Callback de Mercado Pago al que se redirige tras un pago exitoso. Redirecciona al frontend.
* **`GET /failure`**: **Endpoint Público.** Callback de Mercado Pago al que se redirige tras un pago fallido. Redirecciona al frontend.
* **`GET /pending`**: **Endpoint Público.** Callback de Mercado Pago al que se redirige para pagos pendientes. Redirecciona al frontend.

---

### Cupones (`/api/coupons`)

* **`GET /`**: (Admin) Lista todos los cupones (paginado). (Requiere JWT + Admin Role).
* **`GET /:id`**: (Admin) Obtiene un cupón por su ID. (Requiere JWT + Admin Role).
* **`POST /`**: (Admin) Crea un nuevo cupón. (Requiere JWT + Admin Role).
* **`PUT /:id`**: (Admin) Actualiza un cupón existente. (Requiere JWT + Admin Role).
* **`DELETE /:id`**: (Admin) Elimina (o desactiva) un cupón. (Requiere JWT + Admin Role).
* *(Potencialmente un endpoint público `GET /validate/:code` para validar un cupón antes de aplicarlo)*.

---

### Chatbot (`/api/chatbot`)

* **`POST /query`**: Envía una consulta al chatbot y obtiene una respuesta. Puede incluir `sessionId` y `userType`. (Público).
* **`GET /session/:sessionId`**: Obtiene el historial de mensajes de una sesión específica. (Público).
* **`POST /session`**: Crea una nueva sesión de chat. Puede especificar `userType` ('customer' u 'owner'). (Público).
* **`GET /sessions`**: (Admin) Lista todas las sesiones de chat activas/recientes. (Requiere JWT + Admin Role).
* **`POST /generate-embeddings`**: (Admin) Dispara el proceso de generación/actualización de embeddings para la base de conocimiento del RAG. (Requiere JWT + Admin Role).
* **`POST /change-llm`**: (Admin) Cambia el modelo de lenguaje grande (LLM) que utiliza el chatbot (ej: de Claude a OpenAI). (Requiere JWT + Admin Role).
* **`GET /current-llm`**: (Admin) Muestra cuál LLM está configurado actualmente. (Requiere JWT + Admin Role).
* **`GET /validate-embeddings`**: (Admin) Compara el número de documentos en la BD con los embeddings generados para verificar consistencia. (Requiere JWT + Admin Role).

---

### Administración (`/api/admin`)

*(Todos los siguientes endpoints requieren autenticación JWT y rol `ADMIN_ROLE`)*

* **Productos (`/api/admin/products`)**
  * **`GET /`**: Lista todos los productos (incluyendo activos e inactivos), con paginación.
  * **`GET /search`**: Realiza búsquedas y filtrados avanzados sobre todos los productos (activos e inactivos), similar a la búsqueda pública pero potencialmente con más datos/filtros. (Usa el mismo controlador/lógica que `/api/products/search`).
    * **Query Params:** `q`, `categories`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `page`, `limit`.
  * **`GET /:id`**: Obtiene los detalles completos de un producto específico por su ID.
  * **`POST /`**: Crea un nuevo producto (permite subir imagen vía `multipart/form-data` con campo `image`).
  * **`PUT /:id`**: Actualiza un producto existente (permite subir/reemplazar imagen vía `multipart/form-data` con campo `image`).
  * **`DELETE /:id`**: Elimina un producto (y su imagen asociada).
  * **`GET /by-category/:categoryId`**: Lista productos (activos e inactivos) de una categoría específica, con paginación.
* **Categorías (`/api/admin/categories`)**
  * **`GET /`**: Lista todas las categorías (paginado).
  * **`GET /:id`**: Obtiene una categoría por su ID.
  * **`POST /`**: Crea una nueva categoría.
  * **`PUT /:id`**: Actualiza una categoría existente.
  * **`DELETE /:id`**: Elimina una categoría.
* **Unidades (`/api/admin/units`)**
  * **`GET /`**: Lista todas las unidades de medida (paginado).
  * **`GET /:id`**: Obtiene una unidad por su ID.
  * **`POST /`**: Crea una nueva unidad.
  * **`PUT /:id`**: Actualiza una unidad existente.
  * **`DELETE /:id`**: Elimina una unidad.
* **Pedidos (`/api/admin/orders`)**
  * **`GET /`**: Lista todos los pedidos del sistema (paginado).
  * **`GET /:id`**: Obtiene los detalles completos de un pedido específico por su ID.
  * **`PATCH /:id/status`**: Actualiza el estado de un pedido (ej: a 'completed', 'shipped', 'cancelled').
  * **`GET /by-customer/:customerId`**: Lista todos los pedidos de un cliente específico (paginado).
  * **`POST /by-date-range`**: Lista pedidos dentro de un rango de fechas (paginado).
* **Clientes (`/api/admin/customers`)**
  * **`GET /`**: Lista todos los clientes (paginado).
  * **`GET /:id`**: Obtiene un cliente por su ID.
  * **`POST /`**: Crea un nuevo cliente directamente.
  * **`PUT /:id`**: Actualiza la información de un cliente.
  * **`DELETE /:id`**: Elimina un cliente (considerar qué pasa con sus pedidos/direcciones).
  * **`GET /by-neighborhood/:neighborhoodId`**: Lista clientes por barrio (paginado).
  * **`GET /by-email/:email`**: Busca un cliente por su email.
* **Usuarios (`/api/admin/users`)**
  * **`GET /`**: Lista todos los usuarios registrados.
  * **`PUT /:id`**: Actualiza datos de un usuario (ej: asignar/quitar rol `ADMIN_ROLE`). **¡Operación sensible!**
  * **`DELETE /:id`**: Elimina una cuenta de usuario (considerar si también se elimina el cliente asociado).
* **Cupones (`/api/admin/coupons`)**
  * **`GET /`**: Lista todos los cupones (paginado).
  * **`GET /:id`**: Obtiene un cupón por su ID.
  * **`POST /`**: Crea un nuevo cupón.
  * **`PUT /:id`**: Actualiza un cupón existente.
  * **`DELETE /:id`**: Elimina (o desactiva) un cupón.
* **Ciudades (`/api/admin/cities`)**
  * **`GET /`**: Lista todas las ciudades (paginado).
  * **`GET /:id`**: Obtiene una ciudad por su ID.
  * **`POST /`**: Crea una nueva ciudad.
  * **`PUT /:id`**: Actualiza una ciudad existente.
  * **`DELETE /:id`**: Elimina una ciudad (considerar impacto en barrios/direcciones).
  * **`GET /by-name/:name`**: Busca una ciudad por nombre exacto.
* **Barrios (`/api/admin/neighborhoods`)**
  * **`GET /`**: Lista todos los barrios (paginado).
  * **`GET /:id`**: Obtiene un barrio por su ID.
  * **`POST /`**: Crea un nuevo barrio.
  * **`PUT /:id`**: Actualiza un barrio existente.
  * **`DELETE /:id`**: Elimina un barrio (considerar impacto en clientes/direcciones).
  * **`GET /by-city/:cityId`**: Lista barrios por ciudad (paginado).

*(La implementación detallada de algunos métodos de administración, como ver productos inactivos o actualizar roles de usuario de forma segura, podría requerir ajustes o métodos específicos en los controladores y casos de uso correspondientes).*
