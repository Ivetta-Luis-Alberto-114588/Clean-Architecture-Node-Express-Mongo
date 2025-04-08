# Proyecto Backend API - StartUp


API backend robusta construida con Node.js, Express, MongoDB Atlas y TypeScript, siguiendo los principios de Arquitectura Limpia. Incluye funcionalidades de autenticación, gestión de productos, clientes, carrito de compras, ventas, integración con MercadoPago y un chatbot inteligente con RAG.

## ✨ Características Principales

* **Arquitectura Limpia:** Separación clara de responsabilidades (Dominio, Infraestructura, Presentación).
* **Autenticación:** Registro y Login de usuarios con JWT y bcrypt. Middleware de autenticación.
* **Gestión de Productos:** CRUD completo para Productos, Categorías y Unidades de Medida.
* **Gestión de Clientes:** CRUD completo para Clientes, Ciudades y Barrios.
* **Gestión de Carrito de Compras:** Añadir, actualizar, eliminar y listar ítems del carrito por usuario autenticado.
* **Gestión de Ventas:** Creación de ventas con cálculo automático de subtotales, impuestos, descuentos y total. Actualización de stock de productos (transaccional).
* **Integración de Pagos:** Creación de preferencias de pago con MercadoPago, manejo de webhooks y verificación de pagos.
* **Subida de Imágenes:** Integración con Cloudinary para almacenar imágenes de productos.
* **Chatbot Inteligente (RAG):**
  * Procesamiento de lenguaje natural para consultas de clientes y análisis para dueños.
  * Generación y almacenamiento de embeddings para datos relevantes (Productos, Ventas, Clientes, etc.).
  * Búsqueda semántica para encontrar información relevante.
  * Generación de respuestas contextualizadas usando LLMs (OpenAI/Anthropic).
  * Gestión de sesiones de chat.
* **Logging Robusto:** Logging detallado con Winston, rotación de archivos y niveles configurables por entorno. Identificadores de solicitud únicos.
* **Seguridad:** Rate limiting, CORS configurable, manejo seguro de contraseñas. Middleware para manejo de errores.
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
* **MercadoPago:** Integración de pagos (a través de un adaptador propio con Axios).
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

1. **Dominio:** Contiene la lógica de negocio central, entidades (Producto, Venta, Usuario, Carrito, etc.), casos de uso (AddToCart, CreateSale, etc.), interfaces de repositorios y fuentes de datos. Es independiente de frameworks y bases de datos.
2. **Infraestructura:** Implementa las interfaces definidas en el dominio. Incluye los modelos de base de datos (Mongoose), implementaciones concretas de fuentes de datos (MongoDataSource) y repositorios (RepositoryImpl), y adaptadores para servicios externos (MercadoPago, Cloudinary, LLMs, Transformers).
3. **Presentación:** Expone la API REST usando Express. Contiene los controladores, rutas, middlewares (Auth, Logger, RateLimit, Upload) y la configuración del servidor. Interactúa con los casos de uso del dominio.

## ⚙️ Prerequisites

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
   Crea un archivo `.env` en la raíz del proyecto basándote en la plantilla de la sección `.env.example` abajo y rellena tus credenciales.
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


## La API sigue el prefijo **/api**

**La API sigue el prefijo** **/api**. Todos los endpoints (excepto **/auth/login**, **/auth/register**, algunos de pagos como webhooks/callbacks y los del chatbot sin sesión) generalmente requerirán un token JWT válido en la cabecera **Authorization: Bearer `<token>`**.

* **/api/auth**: Registro (**POST /register**), Login (**POST /login**), Obtener usuario del token (**GET /**), etc.
* **/api/products**: CRUD para productos (**GET /**, **GET /:id**, **POST /**, **PUT /:id**, **DELETE /:id**). Incluye subida de imágenes.
* **/api/categories**: CRUD para categorías (**GET /**, **GET /:id**, **POST /**, **PUT /:id**, **DELETE /:id**).
* **/api/units**: CRUD para unidades de medida (**GET /**, **GET /:id**, **POST /**, **PUT /:id**, **DELETE /:id**).
* **/api/cities**: CRUD para ciudades.
* **/api/neighborhoods**: CRUD para barrios.
* **/api/customers**: CRUD para clientes.
* **/api/cart**: Gestión del carrito del usuario autenticado:

  * **GET /**: Obtener el carrito actual.
  * **POST /items**: Añadir un producto o incrementar su cantidad.
  * **PUT /items/:productId**: Establecer la cantidad exacta de un producto.
  * **DELETE /items/:productId**: Eliminar un producto del carrito.
  * **DELETE /**: Vaciar todo el carrito.
* **/api/sales**: Crear (**POST /**) y consultar ventas (**GET /**, **GET /:id**, etc.).
* **/api/payments**: Crear preferencias de pago (**POST /sale/:saleId**), manejar webhooks (**POST /webhook**), verificar pagos (**POST /verify**), etc.
* **/api/chatbot**: Interactuar con el chatbot (**POST /query**), gestionar sesiones (**POST /session**, **GET /session/:sessionId**), generar embeddings (**POST /generate-embeddings**), etc.


## 💡 Puntos a Considerar

* **Seguridad:** **Revisa y ajusta la configuración de** **cors**, **rate-limit** **y** **JWT_SEED** **para producción. Asegúrate de que las variables sensibles no se expongan en el control de versiones.**
* **Webhooks:** **Para probar los webhooks de MercadoPago localmente, necesitarás una herramienta como NGrok para exponer tu endpoint local (**/api/payments/webhook**) a internet y configurar esa URL (**URL_RESPONSE_WEBHOOK_NGROK**) en el archivo** **.env** **y en la configuración de webhooks de MercadoPago.**
* **Errores:** **Revisa la implementación del manejo de errores para asegurar que se capturen y logueen adecuadamente todos los casos.**
* **Optimización:** **Revisa los índices de MongoDB para asegurar un rendimiento óptimo de las consultas, especialmente en colecciones grandes como** **products**, **sales**, **customers**, **payments** **y** **embeddings**.
