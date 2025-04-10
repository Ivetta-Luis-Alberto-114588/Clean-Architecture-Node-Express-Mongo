# Proyecto Backend API - StartUp E-commerce

API backend robusta construida con Node.js, Express, MongoDB Atlas y TypeScript, siguiendo los principios de Arquitectura Limpia. Incluye funcionalidades de autenticación, gestión de productos, clientes, carrito de compras, pedidos (ventas), cupones de descuento, integración con MercadoPago y un chatbot inteligente con RAG.

## ✨ Características Principales

* **Arquitectura Limpia:** Separación clara de responsabilidades (Dominio, Infraestructura, Presentación).
* **Autenticación y Usuarios:**
  * Registro y Login de usuarios con JWT y bcrypt.
  * Middleware de autenticación (`validateJwt`).
  * Creación automática de un registro `Customer` básico vinculado al registrar un `User`.
* **Gestión de Productos:** CRUD completo para Productos, Categorías y Unidades de Medida.
* **Gestión de Clientes:**
  * CRUD completo para Clientes, Ciudades y Barrios.
  * Búsqueda de clientes por email y por ID de usuario (`userId`).
  * Soporte para clientes registrados (vinculados a `User`) e invitados.
* **Gestión de Carrito de Compras:** Añadir, actualizar, eliminar y listar ítems del carrito por usuario autenticado.
* **Gestión de Pedidos (Ventas):**
  * Creación de pedidos para **usuarios autenticados** (usando su `Customer` vinculado) y para **invitados** (creando/reutilizando `Customer` basado en email).
  * Cálculo automático de subtotales, impuestos, descuentos y total.
  * Actualización de stock de productos (transaccional).
  * Consulta de pedidos por ID, cliente y rango de fechas.
  * Actualización de estado de pedidos (ej: pendiente, completado, cancelado) con restauración de stock en cancelaciones (transaccional).
* **Gestión de Cupones:**
  * CRUD completo para cupones de descuento (porcentaje o monto fijo).
  * Validaciones de activación, fechas de validez, monto mínimo de compra y límite de uso total.
  * Aplicación automática en la creación de pedidos con incremento de uso transaccional.
* **Integración de Pagos (MercadoPago):**
  * Creación de preferencias de pago.
  * Manejo de webhooks para actualizar estado de pagos y pedidos.
  * Verificación de estado de pagos y preferencias.
  * Callbacks para redirección (éxito, fallo, pendiente).
  * Soporte para claves de idempotencia.
* **Subida de Imágenes (Cloudinary):** Almacenamiento y gestión de imágenes de productos.
* **Chatbot Inteligente (RAG):**
  * Procesamiento de lenguaje natural para consultas de clientes y análisis para dueños.
  * Generación y almacenamiento de embeddings para datos relevantes (Productos, Pedidos, Clientes, etc.).
  * Búsqueda semántica para encontrar información relevante.
  * Generación de respuestas contextualizadas usando LLMs (OpenAI/Anthropic).
  * Gestión de sesiones de chat.
* **Logging Robusto (Winston):** Logging detallado con rotación de archivos, niveles configurables por entorno e identificadores de solicitud únicos.
* **Seguridad:** Rate limiting (configurable por entorno), CORS configurable, hashing de contraseñas (bcrypt). Middleware para manejo de errores.
* **Validación:** DTOs con validaciones estrictas usando patrón Factory.
* **TypeScript:** Totalmente escrito en TypeScript para mayor seguridad y mantenibilidad.
* **Testing:** Configuración para pruebas unitarias y de integración con Jest y `mongodb-memory-server`.

## 🚀 Tecnologías Utilizadas

* **Node.js:** Entorno de ejecución de JavaScript.
* **Express:** Framework web para Node.js.
* **TypeScript:** Superset de JavaScript con tipado estático.
* **MongoDB Atlas:** Base de datos NoSQL en la nube.
* **Mongoose:** ODM para MongoDB.
* **Clean Architecture:** Patrón de diseño de software.
* **JWT (jsonwebtoken):** Para autenticación basada en tokens.
* **bcryptjs:** Para hashing de contraseñas.
* **Winston & winston-daily-rotate-file:** Para logging.
* **Axios:** Cliente HTTP (usado para adaptadores).
* **MercadoPago SDK/API:** Integración de pagos (a través de un adaptador propio con Axios).
* **Cloudinary:** Para almacenamiento de imágenes.
* **Langchain & @langchain/*:** Framework para construir aplicaciones con LLMs.
* **@xenova/transformers:** Para generación de embeddings localmente.
* **onnxruntime-node:** Motor de inferencia requerido por `@xenova/transformers`.
* **OpenAI / Anthropic:** APIs de Modelos de Lenguaje Grande (LLM) (opcional).
* **dotenv, env-var:** Para manejo de variables de entorno.
* **Multer:** Para manejo de subida de archivos.
* **express-rate-limit:** Para limitar peticiones.
* **cors:** Para habilitar Cross-Origin Resource Sharing.
* **Jest, ts-jest, supertest, mongodb-memory-server, sinon, ts-mockito:** Para testing.
* **uuid:** Para generar identificadores únicos (ej. para logs).

## 🏗️ Arquitectura

El proyecto sigue los principios de la Arquitectura Limpia, separando el código en tres capas principales:

1. **Dominio:** Contiene la lógica de negocio central, entidades (Producto, Pedido, Usuario, Cliente, Carrito, Cupón, etc.), casos de uso (AddToCart, CreateOrder, ApplyCoupon, etc.), interfaces de repositorios y fuentes de datos. Es independiente de frameworks y bases de datos.
2. **Infraestructura:** Implementa las interfaces definidas en el dominio. Incluye los modelos de base de datos (Mongoose), implementaciones concretas de fuentes de datos (MongoDataSource) y repositorios (RepositoryImpl), y adaptadores para servicios externos (MercadoPago, Cloudinary, LLMs, Transformers).
3. **Presentación:** Expone la API REST usando Express. Contiene los controladores, rutas, middlewares (Auth, Logger, RateLimit, Upload) y la configuración del servidor. Interactúa con los casos de uso del dominio.

## ⚙️ Prerrequisitos

* Node.js (v18 o superior recomendado)
* npm o yarn
* Cuenta de MongoDB Atlas
* Cuenta de Cloudinary
* Cuenta de MercadoPago (con credenciales de API)
* (Opcional) Claves API para OpenAI y/o Anthropic si se desea usar esos LLMs para el chatbot.
* NGrok o similar (si se prueban los webhooks de MercadoPago localmente).
* **Importante:** Puede requerir herramientas de compilación (como `python`, `make`, `g++` o Visual Studio Build Tools en Windows) para `onnxruntime-node` si no se encuentra un binario precompilado para tu sistema.

## 🛠️ Instalación y Setup

1. **Clonar el repositorio:**
   ```bash
   git clone https://[URL-DEL-REPOSITORIO]
   cd [NOMBRE-DEL-DIRECTORIO]
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   # o
   yarn install
   ```

   *(Nota: La instalación de `onnxruntime-node` puede tardar y requerir compilación nativa)*.
3. **Crear el archivo `.env`:**
   Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla de la sección `.env.example` abajo y rellena tus credenciales. **Asegúrate de tener un ID de barrio válido para usar como default en `RegisterUserUseCase`**.
4. **Descarga del Modelo de Embeddings:**
   La librería `@xenova/transformers` descargará automáticamente el modelo `Xenova/all-MiniLM-L6-v2` la primera vez que se use (ej., al generar embeddings). Asegúrate de tener conexión a internet. El modelo se guardará en el directorio `models/` dentro del proyecto (según `EMBEDDING_MODEL_PATH` en `.env` si se usa, o el default del adapter).
5. **Generar Embeddings Iniciales (para el Chatbot):**
   Para que el chatbot funcione correctamente con tus datos, necesitas generar los embeddings iniciales. Ejecuta el script dedicado:
   ```bash
   npm run generate-embeddings
   ```

   *Nota: Este script utiliza `transformers-bridge.mjs` probablemente para manejar diferencias entre CommonJS y ES Modules requeridas por `@xenova/transformers`. Este proceso puede tardar dependiendo de la cantidad de datos.*

## 🏃 Ejecución

* **Modo Desarrollo (con recarga automática):**
  ```bash
  npm run dev
  ```
* **Construir para Producción:**
  ```bash
  npm run build
  ```
* **Ejecutar en Producción:**
  *(Ajusta `--max-old-space-size` en el script `start` del `package.json` según la memoria disponible en tu servidor)*.
  ```bash
  npm start
  ```

## 🧪 Pruebas

El proyecto utiliza Jest para las pruebas unitarias y de integración. `mongodb-memory-server` se usa para simular una base de datos MongoDB en memoria durante las pruebas.

* **Ejecutar todas las pruebas:**
  ```bash
  npm test
  ```
* **Ejecutar pruebas en modo "watch":**
  ```bash
  npm run test:watch
  ```
* **Generar reporte de cobertura:**
  ```bash
  npm run test:coverage
  ```

## 📄 Archivo `.env.example` (Plantilla)

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido, **reemplazando los valores entre `<...>` con tus propias credenciales y configuraciones**:

```env
#-------------------------------------
# Server Configuration
#-------------------------------------
PORT=3000
NODE_ENV=development # Opciones: development, production, test

#-------------------------------------
# MongoDB Configuration
#-------------------------------------
# Ejemplo Atlas: mongodb+srv://<user>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
# Ejemplo Local: mongodb://mongo-user:123456@localhost:27017/admin?authSource=admin&directConnection=true
MONGO_URL=<YOUR_MONGODB_CONNECTION_STRING>
MONGO_DB_NAME=<YOUR_DATABASE_NAME>

#-------------------------------------
# JWT Configuration
#-------------------------------------
# IMPORTANTE: Cambia esto por una cadena secreta fuerte y aleatoria. Usa un generador si es posible.
JWT_SEED="<YOUR_VERY_STRONG_AND_SECRET_JWT_SEED>"

#-------------------------------------
# Mercado Pago Configuration
#-------------------------------------
MERCADO_PAGO_PUBLIC_KEY=APP_USR-<your_public_key>
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-<your_access_token>

#-------------------------------------
# ChatBot LLM API Keys (Opcionales)
#-------------------------------------
ANTHROPIC_API_KEY=<YOUR_ANTHROPIC_API_KEY>
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

#-------------------------------------
# Embeddings Configuration (Opcional)
#-------------------------------------
# Ruta donde se guardarán/buscarán los modelos de embedding descargados
# EMBEDDING_MODEL_PATH='./models' # (Si se omite, usará el default de la librería o del adapter)

#-------------------------------------
# Frontend & Webhook Configuration
#-------------------------------------
# URL de tu aplicación frontend (para CORS y redirecciones de pago)
FRONTEND_URL=http://localhost:5173

# URL pública para recibir webhooks de MercadoPago durante el desarrollo local (usando ngrok o similar)
# Asegúrate de que termine SIN barra diagonal (/)
URL_RESPONSE_WEBHOOK_NGROK=https://<your-ngrok-subdomain>.ngrok.io

#-------------------------------------
# Cloudinary Configuration
#-------------------------------------
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
# La URL completa generalmente se obtiene del dashboard de Cloudinary
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>

#-------------------------------------
# Logger Configuration (Opcional)
#-------------------------------------
# Para sobrescribir el nivel de log predeterminado según NODE_ENV
# LOG_LEVEL=debug # Opciones: error, warn, info, http, debug
```



## 🗺️ Endpoints Principales

**La API sigue el prefijo** **/api**.

* **/api/auth**

  * **POST /register**: Registro de nuevo usuario (crea **User** **y** **Customer** **vinculado).**
  * **POST /login**: Inicio de sesión.
  * **GET /**: Obtener datos del usuario autenticado (requiere token).
  * **(Otros endpoints de gestión de usuarios si existen)**
* **/api/products**

  * **GET /**: Obtener lista paginada de productos.
  * **GET /:id**: Obtener un producto por su ID.
  * **POST /**: Crear un nuevo producto (incluye subida de imagen, **requiere rol Admin**).
  * **PUT /:id**: Actualizar un producto (incluye subida de imagen opcional, **requiere rol Admin**).
  * **DELETE /:id**: Eliminar un producto (**requiere rol Admin**).
  * **GET /by-category/:categoryId**: Obtener productos por categoría.
* **/api/categories**

  * **GET /**: Obtener lista paginada de categorías.
  * **GET /:id**: Obtener una categoría por su ID.
  * **POST /**: Crear una nueva categoría (**requiere rol Admin**).
  * **PUT /:id**: Actualizar una categoría (**requiere rol Admin**).
  * **DELETE /:id**: Eliminar una categoría (**requiere rol Admin**).
* **/api/units**

  * **GET /**: Obtener lista paginada de unidades de medida.
  * **GET /:id**: Obtener una unidad por su ID.
  * **POST /**: Crear una nueva unidad (**requiere rol Admin**).
  * **PUT /:id**: Actualizar una unidad (**requiere rol Admin**).
  * **DELETE /:id**: Eliminar una unidad (**requiere rol Admin**).
* **/api/cities**

  * **(CRUD similar a Categorías/Unidades,** **requiere rol Admin** **para modificar)**
* **/api/neighborhoods**

  * **(CRUD similar a Categorías/Unidades, con búsqueda por ciudad,** **requiere rol Admin** **para modificar)**
* **/api/customers**

  * **(CRUD similar a Categorías/Unidades, con búsqueda por barrio/email,** **requiere rol Admin** **para modificar)**
* **/api/cart** **(Requiere autenticación de usuario)**

  * **GET /**: Obtener el carrito del usuario actual.
  * **POST /items**: Añadir un producto o incrementar su cantidad.

    * **Body:** **{ "productId": "...", "quantity": ... }**
  * **PUT /items/:productId**: Establecer la cantidad exacta de un producto.

    * **Body:** **{ "quantity": ... }**
  * **DELETE /items/:productId**: Eliminar un producto del carrito.
  * **DELETE /**: Vaciar todo el carrito.
* **/api/sales** **(Pedidos/Ventas)**

  * **POST /**: Crear un nuevo pedido (**abierto para invitados y usuarios autenticados**).

    * **Body (Invitado):** **{ "items": [...], "customerName": "...", "customerEmail": "...", ... }**
  * **Body (Autenticado):** **{ "items": [...], "couponCode": "..." (opcional) }** **(El cliente se obtiene del** **userId** **del token).**
  * **GET /**: Obtener lista paginada de todos los pedidos (**requiere rol Admin**).
  * **GET /:id**: Obtener un pedido por su ID (**requiere rol Admin** **o ser el dueño del pedido -** **lógica de dueño pendiente**).
  * **PATCH /:id/status**: Actualizar el estado de un pedido (**requiere rol Admin**).

    * **Body:** **{ "status": "...", "notes": "..." (opcional) }**
  * **GET /by-customer/:customerId**: Obtener pedidos de un cliente específico (**requiere rol Admin**).
  * **GET /my-orders**: Obtener el historial de pedidos del usuario autenticado (**requiere autenticación** **-** **Implementación Pendiente**).
  * **POST /by-date-range**: Obtener pedidos dentro de un rango de fechas (**requiere rol Admin**).

    * **Body:** **{ "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }**
* **/api/coupons** **(**Requiere autenticación y rol Admin**)**

  * **POST /**: Crear un nuevo cupón.
* **GET /**: Obtener lista paginada de cupones.
* **GET /:id**: Obtener un cupón por su ID.
* **PUT /:id**: Actualizar un cupón.
* **DELETE /:id**: Eliminar (o desactivar) un cupón.
* **/api/payments**

  * **POST /sale/:saleId**: Crear preferencia de pago para un pedido (requiere autenticación del dueño del pedido o rol Admin).
  * **POST /webhook**: Endpoint para recibir notificaciones de MercadoPago (público).
  * **GET /success**: Callback de éxito de MercadoPago (público).
  * **GET /failure**: Callback de fallo de MercadoPago (público).
  * **GET /pending**: Callback de pendiente de MercadoPago (público).
  * **POST /verify**: Verificar el estado de un pago (requiere autenticación Admin o dueño).
  * **GET /:id**: Obtener detalles de un pago registrado (requiere autenticación Admin o dueño).
  * **(Otros endpoints para listar pagos, etc.)**
* **/api/chatbot**

  * **POST /query**: Enviar una consulta al chatbot.
  * **POST /session**: Crear una nueva sesión de chat.
  * **GET /session/:sessionId**: Obtener detalles y mensajes de una sesión.
  * **POST /generate-embeddings**: (**Admin**) Disparar la generación/actualización de embeddings.
  * **(Otros endpoints para gestión de sesiones, cambio de LLM, etc.)**

## 💡 Puntos a Considerar

* **Seguridad:** **Revisa y ajusta la configuración de** **cors**, **rate-limit** **y** **JWT_SEED** **para producción. Asegúrate de que las variables sensibles no se expongan en el control de versiones.**
* **Vinculación User-Customer:** **La vinculación básica está implementada (se crea** **Customer** **al registrar** **User** **y se usa** **findByUserId** **al crear pedido autenticado).** **Revisa la lógica de creación inicial del** **Customer** **en** **RegisterUserUseCase**, especialmente el **defaultNeighborhoodId** **y los datos placeholder (teléfono, dirección). Considera implementar endpoints para que el usuario actualice su perfil/cliente.**
* **Roles (RBAC):** **Implementa y aplica un middleware** **checkRole(['ADMIN_ROLE'])** **para proteger adecuadamente los endpoints administrativos marcados.**
* **Webhooks:** **Para probar los webhooks de MercadoPago localmente, necesitarás una herramienta como NGrok para exponer tu endpoint local (**/api/payments/webhook**) a internet y configurar esa URL (**URL_RESPONSE_WEBHOOK_NGROK**) en el archivo** **.env** **y en la configuración de webhooks de MercadoPago.**
* **Errores:** **Revisa la implementación del manejo de errores para asegurar que se capturen y logueen adecuadamente todos los casos.**
* **Optimización:** **Revisa los índices de MongoDB para asegurar un rendimiento óptimo de las consultas, especialmente en colecciones grandes como** **products**, **orders**, **customers**, **payments**, **coupons** **y** **embeddings**.
* **Funcionalidades Pendientes:** **Gestión de perfil de usuario, historial de pedidos (**/my-orders**), restablecimiento de contraseña, reembolsos de MercadoPago.**

<pre _ngcontent-ng-c3995996630=""><br class="Apple-interchange-newline"/>

</pre>


**Resumen de los Cambios en este README:**

1. **Características Principales:**
   * Actualizada la descripción de "Autenticación y Usuarios" para incluir la creación automática de `Customer`.
   * Actualizada la descripción de "Gestión de Clientes" para incluir la búsqueda por `userId` y el soporte a invitados/registrados.
   * Actualizada la descripción de "Gestión de Pedidos" para reflejar el soporte a invitados y autenticados.
2. **Instalación y Setup:**
   * Añadida una nota sobre la necesidad de configurar un `defaultNeighborhoodId` válido en `RegisterUserUseCase`.
3. **Endpoints Principales:**
   * Aclarado el `body` esperado para `POST /api/sales` en ambos escenarios (invitado/autenticado).
   * Marcado explícitamente qué endpoints requieren rol de Admin (aunque el middleware aún esté pendiente).
   * Se mantuvo `/api/sales/my-orders` como pendiente.
4. **Puntos a Considerar:**
   * Actualizada la nota sobre la vinculación User-Customer para reflejar que la base está implementada, pero necesita refinamiento (datos iniciales, actualización de perfil).
   * Se mantuvo la nota sobre la necesidad de implementar el middleware RBAC.
   * Se añadió una lista explícita de funcionalidades pendientes importantes.
