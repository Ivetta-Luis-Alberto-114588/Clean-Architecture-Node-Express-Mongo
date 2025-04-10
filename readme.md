# StartUp E-commerce API (Backend)

Este es el backend para una aplicación de E-commerce completa, construida con Node.js, TypeScript, Express y MongoDB. Incorpora características modernas como autenticación JWT, integración con pasarelas de pago, gestión de productos/clientes (con **búsqueda y filtrado avanzados**), un carrito de compras, sistema de cupones y un chatbot inteligente basado en RAG (Retrieval-Augmented Generation).

## ✨ Características Principales

* **Autenticación:**
  * Registro de usuarios (con creación automática de perfil de cliente).
  * Inicio de sesión con JWT (JSON Web Tokens).
  * Recuperación de contraseña (solicitud y reseteo por email).
  * Middleware para proteger rutas.
* **Gestión de Productos:**
  * CRUD completo para Productos.
  * CRUD completo para Categorías.
  * CRUD completo para Unidades de medida.
  * **Búsqueda y Filtrado Avanzado:** Búsqueda por texto (nombre, descripción), filtrado por categoría(s), rango de precios y ordenamiento configurable (precio, nombre, relevancia, fecha).
  * Asociación de productos con categorías y unidades.
  * Cálculo de precios con IVA.
  * Gestión de stock.
* **Gestión de Clientes:**
  * CRUD completo para Clientes (con soporte para invitados).
  * CRUD completo para Ciudades.
  * CRUD completo para Barrios (asociados a ciudades).
  * Vinculación de Usuarios registrados con perfiles de Cliente.
* **Carrito de Compras:**
  * Añadir/actualizar/eliminar ítems.
  * Obtener el carrito del usuario actual.
  * Vaciar carrito.
  * Almacena precios y tasas de IVA al momento de agregar el ítem.
* **Gestión de Pedidos (Ventas):**
  * Creación de pedidos desde el carrito o datos directos.
  * Cálculo automático de subtotales, impuestos, descuentos y total.
  * Aplicación de cupones de descuento (porcentual o fijo).
  * Actualización de estado del pedido (pendiente, completado, cancelado).
  * Restauración de stock al cancelar un pedido.
  * Historial de pedidos por cliente (/my-orders para usuarios autenticados).
  * Búsqueda de pedidos por cliente y rango de fechas.
* **Integración de Pagos (Mercado Pago):**
  * Creación de preferencias de pago.
  * Manejo de callbacks (success, failure, pending).
  * Procesamiento de webhooks para actualizar el estado del pago y del pedido.
  * Verificación del estado del pago.
  * Almacenamiento de información de pago en la base de datos.
  * Soporte para claves de idempotencia.
* **Sistema de Cupones:**
  * CRUD completo para Cupones.
  * Tipos de descuento: Porcentual y Fijo.
  * Validaciones: Fechas de validez, monto mínimo de compra, límite de uso.
  * Incremento automático del contador de uso.
* **Chatbot Inteligente (RAG):**
  * Modelo basado en Retrieval-Augmented Generation.
  * Generación de embeddings para Productos, Categorías, Ventas, Clientes, etc., usando `Transformers.js`.
  * Búsqueda semántica de información relevante para responder consultas.
  * Integración con LLMs (OpenAI GPT y Anthropic Claude Haiku/Sonnet/Opus) a través de Langchain.
  * Modos de operación: Asistente para clientes y Asistente de análisis para dueños.
  * Gestión de sesiones de chat.
  * Comandos para generar/validar embeddings y cambiar el LLM activo.
* **Subida de Imágenes (Cloudinary):**
  * Integración para subir imágenes de productos.
  * Eliminación automática de imágenes antiguas al actualizar.
* **Notificaciones por Email (Nodemailer):**
  * Envío de correos para restablecimiento de contraseña.
  * Infraestructura preparada para otros tipos de notificaciones.
* **Infraestructura y Calidad:**
  * Arquitectura en capas (similar a Clean Architecture): Presentation, Domain, Infrastructure.
  * Uso de DataSources, Repositories y Casos de Uso.
  * Mapeo de datos entre capas (Mappers).
  * Validación de datos de entrada (DTOs - Data Transfer Objects).
  * Manejo centralizado de errores (CustomError).
  * Logging avanzado con Winston (logs diarios rotativos, diferentes niveles, formato JSON y consola).
  * Middleware de Rate Limiting para proteger contra ataques de fuerza bruta.
  * Variables de entorno centralizadas y validadas (`dotenv`, `env-var`).
  * Configuración de CORS.

## 🛠️ Tecnologías Utilizadas

* **Backend:** Node.js, Express.js
* **Lenguaje:** TypeScript
* **Base de Datos:** MongoDB con Mongoose (**incluye Índices de Texto y Aggregation Pipeline para búsqueda**)
* **Autenticación:** JWT (jsonwebtoken), bcryptjs
* **Pagos:** Mercado Pago SDK (vía API REST con Axios)
* **Chatbot:**
  * Langchain.js (@langchain/core, @langchain/openai, @langchain/mongodb)
  * Transformers.js (@xenova/transformers)
  * OpenAI API / Anthropic API
* **Subida de Imágenes:** Cloudinary
* **Emails:** Nodemailer
* **Logging:** Winston, winston-daily-rotate-file
* **Variables de Entorno:** dotenv, env-var
* **Rate Limiting:** express-rate-limit
* **Otros:** CORS, uuid

## 🏗️ Arquitectura

El proyecto sigue una arquitectura en capas inspirada en principios de Clean Architecture:

1. **Domain:** Contiene la lógica de negocio central, entidades, casos de uso, interfaces de repositorios y datasources, DTOs y errores personalizados. No depende de ninguna otra capa.
2. **Infrastructure:** Implementa las interfaces definidas en el dominio. Contiene los adaptadores para servicios externos (BD, APIs), implementaciones de datasources y repositorios, y mappers para convertir datos entre capas. Depende del Dominio.
3. **Presentation:** Expone la API REST. Contiene los controladores, rutas y middlewares. Es responsable de recibir las solicitudes, validarlas (usando DTOs), llamar a los casos de uso y devolver las respuestas. Depende del Dominio.

## 📋 Prerrequisitos

* Node.js (v18 o superior recomendado)
* npm o yarn
* MongoDB (v4.2+ para text search optimizado, v5+ recomendado) (local o Atlas)
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
3. **Configura las variables de entorno (`.env`):** (Mismas variables que antes)

   ```env
   # Server
   PORT=3000
   NODE_ENV=development # development | production | test
   FRONTEND_URL=http://localhost:5173 # URL de tu frontend para redirecciones

   # MongoDB
   MONGO_URL=mongodb://localhost:27017 # O tu URL de Atlas
   MONGO_DB_NAME=ecommerce_db

   # JWT
   JWT_SEED=ESTE_ES_MI_SEED_SECRETO_CAMBIAME

   # Mercado Pago
   MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxx
   MERCADO_PAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

   # LLM APIs (Chatbot)
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx
   OPENAI_API_KEY=sk-xxxxxxxxxxxx

   # Webhook (Usa ngrok o similar en desarrollo)
   URL_RESPONSE_WEBHOOK_NGROK=https://tu-dominio-o-ngrok.com/

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   CLOUDINARY_URL=cloudinary://tu_api_key:tu_api_secret@tu_cloud_name

   # Email Service (ej. Gmail)
   EMAIL_SERVICE=gmail
   EMAIL_USER=tu_correo@gmail.com
   EMAIL_PASS=tu_contraseña_de_aplicacion
   EMAIL_SENDER_NAME="Tu Tienda Online"
   ```
4. **(Importante) Crear índices de MongoDB:** Al iniciar la aplicación por primera vez después de añadir el índice de texto en `product.model.ts`, asegúrate de que Mongoose lo cree. Si no, conéctate a tu base de datos con `mongosh` y ejecuta:

   ```bash
   use ecommerce_db  # O el nombre de tu BD
   db.products.createIndexes()
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



## 🌐 API Endpoints Principales

* **Autenticación (`/api/auth`)**

  * `POST /register`: Registro de nuevo usuario.
  * `POST /login`: Inicio de sesión (protegido por Rate Limit).
  * `GET /`: Obtener datos del usuario autenticado (requiere JWT).
  * `GET /all`: Obtener lista de todos los usuarios (puede requerir auth/admin).
  * `PUT /:id`: Actualizar datos de un usuario (puede requerir auth/admin).
  * `DELETE /:id`: Eliminar un usuario (puede requerir auth/admin).
  * `POST /forgot-password`: Solicitar reseteo de contraseña (protegido por Rate Limit).
  * `POST /reset-password`: Resetear contraseña con token (protegido por Rate Limit).
* **Productos (`/api/products`)**

  * `GET /search`: Realiza búsquedas avanzadas y filtrado. **Parámetros Query:**
    * `q` (string): Término de búsqueda (nombre, descripción).
    * `categories` (string): IDs de categorías separadas por comas (ej: `id1,id2`).
    * `minPrice` (number): Precio mínimo.
    * `maxPrice` (number): Precio máximo.
    * `sortBy` (string): Campo para ordenar (`relevance`, `price`, `createdAt`, `name`). Default: `relevance` si hay `q`, sino `createdAt`.
    * `sortOrder` (string): Dirección de orden (`asc`, `desc`). Default: `desc`.
    * `page` (number): Número de página. Default: `1`.
    * `limit` (number): Resultados por página. Default: `10`.
  * `GET /by-category/:categoryId`: Listar productos por categoría (paginado).
  * `GET /`: Listar todos los productos (paginado).
  * `GET /:id`: Obtener un producto por ID.
  * `POST /`: Crear un nuevo producto (requiere auth, subida de imagen opcional vía `multipart/form-data` con campo `image`).
  * `PUT /:id`: Actualizar un producto (requiere auth, subida de imagen opcional vía `multipart/form-data` con campo `image`).
  * `DELETE /:id`: Eliminar un producto (requiere auth).
* **Categorías (`/api/categories`)**

  * `GET /`: Listar categorías (paginado).
  * `GET /:id`: Obtener categoría por ID.
  * `POST /`: Crear categoría (requiere auth).
  * `PUT /:id`: Actualizar categoría (requiere auth).
  * `DELETE /:id`: Eliminar categoría (requiere auth).
* **Unidades (`/api/units`)**

  * `GET /`: Listar unidades (paginado).
  * `GET /:id`: Obtener unidad por ID.
  * `POST /`: Crear unidad (requiere auth).
  * `PUT /:id`: Actualizar unidad (requiere auth).
  * `DELETE /:id`: Eliminar unidad (requiere auth).
* **Ciudades (`/api/cities`)**

  * `GET /`: Listar ciudades (paginado).
  * `GET /:id`: Obtener ciudad por ID.
  * `GET /by-name/:name`: Buscar ciudad por nombre exacto.
  * `POST /`: Crear ciudad (requiere auth).
  * `PUT /:id`: Actualizar ciudad (requiere auth).
  * `DELETE /:id`: Eliminar ciudad (requiere auth).
* **Barrios (`/api/neighborhoods`)**

  * `GET /`: Listar barrios (paginado).
  * `GET /:id`: Obtener barrio por ID.
  * `GET /by-city/:cityId`: Listar barrios por ciudad (paginado).
  * `POST /`: Crear barrio (requiere auth).
  * `PUT /:id`: Actualizar barrio (requiere auth).
  * `DELETE /:id`: Eliminar barrio (requiere auth).
* **Clientes (`/api/customers`)**

  * `GET /`: Listar clientes (paginado, requiere auth/admin).
  * `GET /:id`: Obtener cliente por ID (requiere auth/admin).
  * `GET /by-neighborhood/:neighborhoodId`: Listar clientes por barrio (paginado, requiere auth/admin).
  * `GET /by-email/:email`: Buscar cliente por email (requiere auth/admin).
  * `POST /`: Crear cliente (puede ser usado por admin o internamente por registro).
  * `PUT /:id`: Actualizar cliente (requiere auth/admin).
  * `DELETE /:id`: Eliminar cliente (requiere auth/admin).
* **Carrito (`/api/cart`)** (Requieren JWT)

  * `GET /`: Obtener el carrito del usuario autenticado.
  * `POST /items`: Añadir un item al carrito.
  * `PUT /items/:productId`: Actualizar cantidad de un item en el carrito.
  * `DELETE /items/:productId`: Eliminar un item específico del carrito.
  * `DELETE /`: Vaciar todo el carrito del usuario.
* **Pedidos/Ventas (`/api/sales`)**

  * `POST /`: Crear un nuevo pedido (puede requerir JWT o permitir datos de invitado).
  * `GET /`: Listar todos los pedidos (paginado, requiere auth/admin).
  * `GET /my-orders`: Listar los pedidos del usuario autenticado (paginado, requiere JWT).
  * `GET /:id`: Obtener un pedido por ID (requiere auth/admin o ser el dueño del pedido).
  * `PATCH /:id/status`: Actualizar estado de un pedido (requiere auth/admin).
  * `GET /by-customer/:customerId`: Listar pedidos de un cliente específico (paginado, requiere auth/admin).
  * `POST /by-date-range`: Listar pedidos por rango de fechas (paginado, requiere auth/admin).
* **Pagos (`/api/payments`)**

  * `POST /sale/:saleId`: Iniciar proceso de pago para una venta (puede requerir auth).
  * `POST /prueba/sale/:saleId`: Iniciar proceso de pago de prueba (puede requerir auth).
  * `GET /`: Listar todos los pagos de la BD local (paginado, requiere auth/admin).
  * `GET /:id`: Obtener información de un pago local por ID (requiere auth/admin).
  * `GET /by-sale/:saleId`: Listar pagos locales asociados a una venta (paginado, requiere auth/admin).
  * `POST /verify`: Verificar el estado de un pago con el proveedor (requiere auth).
  * `GET /preference/:preferenceId`: Verificar estado de una preferencia y pago asociado (puede requerir auth).
  * `GET /mercadopago/payments`: Consultar directamente a Mercado Pago los pagos *realizados* por la cuenta (requiere auth/admin).
  * `GET /mercadopago/charges`: Consultar directamente a Mercado Pago los *cobros recibidos* por la cuenta (requiere auth/admin).
  * `POST /webhook`: Endpoint público para recibir notificaciones de Mercado Pago.
  * `GET /success`: Callback de Mercado Pago para pagos exitosos (redirecciona al frontend).
  * `GET /failure`: Callback de Mercado Pago para pagos fallidos (redirecciona al frontend).
  * `GET /pending`: Callback de Mercado Pago para pagos pendientes (redirecciona al frontend).
* **Cupones (`/api/coupons`)** (Requieren JWT y rol Admin)

  * `GET /`: Listar cupones (paginado).
  * `GET /:id`: Obtener cupón por ID.
  * `POST /`: Crear cupón.
  * `PUT /:id`: Actualizar cupón.
  * `DELETE /:id`: Eliminar (o desactivar) cupón.
* **Chatbot (`/api/chatbot`)**

  * `POST /query`: Enviar consulta al chatbot (público).
  * `GET /session/:sessionId`: Obtener historial de una sesión (público).
  * `POST /session`: Crear una nueva sesión (público).
  * `GET /sessions`: Listar todas las sesiones (requiere auth/admin).
  * `POST /generate-embeddings`: (Admin) Generar/regenerar embeddings.
  * `POST /change-llm`: (Admin) Cambiar el modelo LLM activo.
  * `GET /current-llm`: (Admin) Obtener el modelo LLM actual.
  * `GET /validate-embeddings`: (Admin) Validar la consistencia de los embeddings.

---

**(Nota:** La necesidad exacta de autenticación y roles (`requiere auth`, `requiere JWT`, `requiere auth/admin`) debe ser implementada y verificada con los middlewares correspondientes en las rutas. Esta lista asume los casos de uso más comunes.)


💡 Decisiones Arquitectónicas y Destacados

* **TypeScript, Arquitectura en Capas, Inyección de Dependencias Manual, DTOs, Mappers, Logging Detallado, Chatbot RAG, Integración con Servicios Externos.**
* **Búsqueda eficiente:** **Uso de Índices de Texto y Aggregation Pipeline de MongoDB para búsqueda y filtrado sin añadir servicios externos inicialmente.**

## 🚧 Mejoras Futuras / TODO

* **Implementar Pruebas .**
* **Roles y Permisos detallados (RBAC).**
* **Refinar Middleware** **AuthMiddleware.checkRole**.
* **Mejorar gestión de errores y validaciones.**
* **Añadir Swagger/OpenAPI.**
* **Optimizar consultas.**
* **Refinar lógica del chatbot.**
* **Añadir más proveedores de pago.**
* **Sistema de reviews.**
* **Scripts de despliegue (Docker).**
* **Gestión de Variaciones de Producto.**
* **Lógica de Envío y Cálculo de Costos.**
* **Panel de Administración.**
* **Wishlist.**
* **Recomendaciones de Productos.**

## 🤝 Contribuciones

**Las contribuciones son bienvenidas. Por favor, abre un issue o un Pull Request.**

## 📄 Licencia

...


## 💡 Decisiones Arquitectónicas y Destacados

* **TypeScript, Arquitectura en Capas, Inyección de Dependencias Manual, DTOs, Mappers, Logging Detallado, Chatbot RAG, Integración con Servicios Externos.**
* **Búsqueda eficiente:** **Uso de Índices de Texto y Aggregation Pipeline de MongoDB para búsqueda y filtrado sin añadir servicios externos inicialmente.**

## 🚧 Mejoras Futuras / TODO

* **Roles y Permisos detallados (RBAC).**
* **Refinar Middleware** **AuthMiddleware.checkRole**.
* **Mejorar gestión de errores y validaciones.**
* **Añadir Swagger/OpenAPI.**
* **Optimizar consultas.**
* **Refinar lógica del chatbot.**
* **Añadir más proveedores de pago.**
* **Sistema de reviews.**
* **Scripts de despliegue (Docker).**
* **Gestión de Variaciones de Producto.**
* **Lógica de Envío y Cálculo de Costos.**
* **Panel de Administración.**
* **Wishlist.**
* **Recomendaciones de Productos.**

## 🤝 Contribuciones

**Las contribuciones son bienvenidas. Por favor, abre un issue o un Pull Request.**

## 📄 Licencia

**(Opcional: Especifica tu licencia, ej. MIT)**
