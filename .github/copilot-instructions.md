# Instrucciones para GitHub Copilot - Backend E-commerce

Este documento guía a Copilot para generar código consistente y alineado con la arquitectura y convenciones de este proyecto de backend para un E-commerce.

## 1. Resumen del Proyecto

Este es el backend de una aplicación de E-commerce construido con Node.js, Express, TypeScript y MongoDB. Sigue una arquitectura inspirada en Clean Architecture, separando responsabilidades en capas: Domain, Infraestructure y Presentation (tambien tendra configs, seeders si hiciera falta)

**Tecnologías Principales:**

* Node.js, TypeScript
* Express.js
* MongoDB con Mongoose
* JSON Web Tokens (JWT) para autenticación
* Bcryptjs para hashing de contraseñas
* Cloudinary para almacenamiento de imágenes
* Mercado Pago para procesamiento de pagos
* Winston para logging
* Dotenv y env-var para gestión de variables de entorno
* Langchain y Transformers.js para funcionalidades de Chatbot/IA (Embeddings, RAG)
* Nodemailer para envío de correos
* Telegram para envío de mensajes

## 2. Arquitectura General

**Principios Fundamentales:**

1. **Arquitectura Limpia:** El proyecto sigue una estructura de capas inspirada en Clean Architecture (Dominio, Infraestructura, Presentación) con un flujo de dependencias hacia el centro (Dominio).
2. **Mejores Prácticas:** Se prioriza la mantenibilidad, testeabilidad, seguridad y claridad del código. Esto incluye:
   * Validación rigurosa de DTOs.
   * Manejo centralizado de errores.
   * Logging detallado.
   * Uso de patrones de diseño (Factory para DTOs, Repository, Use Case).
   * Separación de responsabilidades.
   * Uso de transacciones para operaciones críticas.

El proyecto se organiza en las siguientes capas principales:

* **`src/domain`**: Contiene la lógica de negocio pura y las definiciones.
  * `entities`: Clases TypeScript que representan los objetos del dominio (UserEntity, ProductEntity, etc.). Son POJOs (Plain Old JavaScript Objects).
  * `dtos`: Data Transfer Objects para validación y transferencia de datos entre capas, especialmente desde la capa de Presentación al Dominio. Usan un patrón factory con un método estático `create()` o `update()` para validación y creación.
  * `datasources`: Interfaces abstractas que definen cómo se accede a los datos (ej. `AuthDatasource`, `ProductDatasource`).
  * `repositories`: Interfaces abstractas que definen cómo se interactúa con los datasources para realizar operaciones de negocio.
  * `use-cases`: Clases que encapsulan lógica de negocio específica, orquestando llamadas a repositorios.
  * `errors`: Clases de error personalizadas (ej. `CustomError`).
  * `interfaces`: Interfaces para servicios externos (ej. `EmailService`, `MercadoPagoInterface`).
* **`src/infrastructure`**: Implementaciones concretas de las abstracciones del dominio y adaptadores a servicios externos.
  * `datasources`: Implementaciones de los `Datasource` del dominio, usualmente usando Mongoose (ej. `AuthMongoDataSourceImpl`).
  * `repositories`: Implementaciones de los `Repository` del dominio, usualmente delegando a los datasources concretos.
  * `mappers`: Clases responsables de convertir objetos de la base de datos (documentos Mongoose) a `Entities` del dominio y viceversa.
  * `adapters`: Clases para interactuar con servicios de terceros (Cloudinary, Mercado Pago, Nodemailer, LLMs).
  * `services`: Implementaciones de servicios (ej. `NotificationServiceImpl`).
* **`src/presentation`**: Maneja las interacciones HTTP (Express.js).
  * `controllers`: Manejan las peticiones HTTP, validan DTOs, llaman a los Use Cases y devuelven respuestas.
  * `routes`: Definen las rutas de la API y las asocian con los métodos de los controllers.
  * `middlewares`: Funciones que se ejecutan antes de los controllers (ej. autenticación, logging, rate limiting).
* **`src/data/mongodb/models`**: Define los esquemas de Mongoose para las colecciones de MongoDB.
* **`src/configs`**: Configuraciones globales de la aplicación (variables de entorno, JWT, Bcrypt, logger, etc.).
* **`src/seeders`**: Scripts para poblar la base de datos con datos iniciales.

## 3. Patrones y Convenciones Clave

* **DTOs (Data Transfer Objects)**:
  * Se definen en `src/domain/dtos/`.
  * Usan un constructor privado y un método estático `create()` (o `update()` para actualizaciones) que realiza validaciones y devuelve una tupla `[string?, DtoClass?]`.
  * Ejemplo: `const [error, createProductDto] = CreateProductDto.create(req.body);`
* **Entidades de Dominio**:
  * Se definen en `src/domain/entities/`.
  * Son clases TypeScript simples que representan los objetos de negocio.
  * No deben tener dependencias de frameworks o librerías de infraestructura.
* **Mappers**:
  * Se definen en `src/infrastructure/mappers/`.
  * Convierten documentos de Mongoose (de `src/data/mongodb/models/`) a Entidades de Dominio y viceversa.
  * Método común: `static fromObjectToEntityName(object: any): EntityName`.
* **Datasources y Repositories**:
  * Las interfaces (contratos) se definen en `src/domain/datasources/` y `src/domain/repositories/`.
  * Las implementaciones concretas (usando Mongoose) están en `src/infrastructure/datasources/` y `src/infrastructure/repositories/`.
* **Use Cases**:
  * Se definen en `src/domain/use-cases/`.
  * Tienen un método `execute()` que encapsula una operación de negocio específica.
  * Reciben repositorios (interfaces) como dependencias.
* **Manejo de Errores**:
  * Utilizar la clase `CustomError` (`src/domain/errors/custom.error.ts`) para errores de negocio y de validación.
  * Los controllers tienen un método `handleError` para centralizar la respuesta de errores.
* **Logging**:
  * Utilizar el logger configurado en `src/configs/logger.ts` (Winston).
  * Middleware `LoggerMiddleware` para logs de petición/respuesta.
  * Loguear información relevante en Use Cases y Datasources, especialmente errores.
* **Variables de Entorno**:
  * Centralizadas en `src/configs/envs.ts` usando `dotenv` y `env-var`.
  * Acceder a ellas a través del objeto `envs`.
* **Autenticación**:
  * JWT (`JwtAdapter` en `src/configs/jwt.ts`).
  * Middleware `AuthMiddleware` para validar JWT y roles.
* **Hashing**:
  * `BcryptAdapter` en `src/configs/bcrypt.ts` para contraseñas.
* **Manejo de Archivos/Imágenes**:
  * `UploadMiddleware` para `multer`.
  * `CloudinaryAdapter` para subir/eliminar imágenes en Cloudinary.
* **Estructura de Rutas**:
  * Las rutas se agrupan por módulo (`auth`, `products`, `admin`, etc.).
  * Las rutas de administración están bajo el prefijo `/api/admin` y protegidas por `AuthMiddleware` y `checkRole(['ADMIN_ROLE'])`.
* **Paginación**:
  * Usar `PaginationDto` para los parámetros `page` y `limit`.
  * Los métodos de repositorio y datasource que devuelven listas paginadas deben devolver un objeto `{ total: number, items: Entity[] }`.

## 4. Entidades Principales y sus Relaciones (Modelos Mongoose)

* **User (`user.model.ts`)**: Usuarios de la aplicación, con roles.
* **Customer (`customer.model.ts`)**: Perfil del cliente, puede estar asociado a un `User` o ser un invitado. Tiene `Neighborhood`.
* **Address (`address.model.ts`)**: Direcciones de envío de un `Customer`. Tiene `Neighborhood` y `City`.
* **City (`city.model.ts`)**: Ciudades.
* **Neighborhood (`neighborhood.model.ts`)**: Barrios, pertenecen a una `City`.
* **Product (`product.model.ts`)**: Productos. Tienen `Category`, `Unit` y `Tags`. Incluye `priceWithTax` (virtual).
* **Category (`category.model.ts`)**: Categorías de productos.
* **Unit (`unit.model.ts`)**: Unidades de medida para productos.
* **Tag (`tag.model.ts`)**: Etiquetas para productos (ej: "oferta", "nuevo").
* **Cart (`cart.model.ts`)**: Carrito de compras, asociado a un `User`. Contiene `CartItem`s embebidos.
  * `CartItem`: Producto, cantidad, precio al momento de agregar, tasa de IVA.
* **Order (`order.model.ts`)**: Pedidos/Ventas. Asociado a un `Customer`. Contiene `OrderItem`s embebidos y `ShippingDetails`. Tiene un `OrderStatus`.
* **OrderStatus (`order-status.model.ts`)**: Estados de un pedido (Pendiente, Completado, etc.).
* **Coupon (`coupon.model.ts`)**: Cupones de descuento.
* **Payment (`payment.model.ts`)**: Registros de pagos, asociados a una `Order` y `Customer`. Integración con Mercado Pago.
* **PaymentMethod (`payment-method.model.ts`)**: Métodos de pago (Efectivo, MP, etc.).
* **Chat (`chat-models.ts`)**:
  * `ChatMessage`: Mensajes individuales de una conversación.
  * `ChatSession`: Agrupa mensajes de una sesión.
  * `Embedding`: Vectores de embeddings para búsqueda semántica.

## 5. Instrucciones Específicas para Copilot

* **Al generar nuevo código para una entidad (ej. "Ofertas Especiales"):**
  1. Crear el **DTO** (`CreateOfertaDto`, `UpdateOfertaDto`) en `domain/dtos/ofertas/`.
  2. Crear la **Entidad** (`OfertaEntity`) en `domain/entities/ofertas/`.
  3. Definir la interfaz del **Datasource** (`OfertaDatasource`) en `domain/datasources/ofertas/`.
  4. Definir la interfaz del **Repository** (`OfertaRepository`) en `domain/repositories/ofertas/`.
  5. Crear el **Modelo Mongoose** (`oferta.model.ts`) en `data/mongodb/models/ofertas/`.
  6. Implementar el **Mapper** (`OfertaMapper`) en `infrastructure/mappers/ofertas/`.
  7. Implementar el **Datasource** (`OfertaMongoDataSourceImpl`) en `infrastructure/datasources/ofertas/`.
  8. Implementar el **Repository** (`OfertaRepositoryImpl`) en `infrastructure/repositories/ofertas/`.
  9. Crear los **Use Cases** (ej. `CreateOfertaUseCase`) en `domain/use-cases/ofertas/`.
  10. Crear el **Controller** (`OfertaController`) en `presentation/ofertas/`.
  11. Definir las **Rutas** (`oferta.routes.ts`) en `presentation/ofertas/` y agregarlas a `MainRoutes` y/o `AdminRoutes`.
* **DTOs**: Siempre incluir el método estático `create()` (y `update()` si aplica) con validaciones. El constructor debe ser privado.
* **Mappers**: Al mapear desde un objeto de Mongoose, asegúrate de manejar campos poblados y convertir `_id` a `id` (string).
* **Controllers**:
  * Deben recibir repositorios (o Use Cases) como dependencias.
  * Usar el método `handleError` para la gestión de errores.
  * Usar DTOs para validar la entrada (`req.body`, `req.query`, `req.params`).
* **Validación**: La validación de datos de entrada se hace en los DTOs. La validación de lógica de negocio se hace en los Use Cases.
* **Errores**: Lanzar `CustomError` para errores específicos.
* **Logging**: Utiliza `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()` donde sea apropiado. En Datasources y Repositories, loguea las operaciones y errores.
* **Seguridad**:
  * Para contraseñas, siempre usar `BcryptAdapter.hash()` y `BcryptAdapter.compare()`.
  * Para tokens, usar `JwtAdapter.generateToken()` y `JwtAdapter.validateToken()`.
  * Las rutas de administrador deben estar protegidas con `AuthMiddleware.validateJwt` y `AuthMiddleware.checkRole(['ADMIN_ROLE'])`.
* **Servicios Externos**: Utilizar los adaptadores correspondientes (`CloudinaryAdapter`, `MercadoPagoAdapter`, `NodemailerAdapter`).
* **Paginación**: Cuando un endpoint devuelve una lista, implementar paginación usando `PaginationDto` y devolver `{ total, items }`.
* **Población (Populate)**: Al obtener datos de Mongoose que tienen referencias, recuerda usar `.populate()` para traer los datos relacionados. Mapea estos datos poblados en el Mapper correspondiente.
  * Ejemplo en `CartMongoDataSourceImpl`: `populate({ path: 'items.productId', model: 'Product', populate: [...] })`.
* **Transacciones MongoDB**: Para operaciones críticas que involucren múltiples escrituras (ej. crear un pedido y actualizar stock), usa transacciones de Mongoose (`session.startTransaction()`, `session.commitTransaction()`, `session.abortTransaction()`).

## 6. Estilo de Código y Formato

* Mantener la consistencia con el código existente.
* Usar `async/await` para operaciones asíncronas.
* Comentar el código donde sea necesario para explicar lógica compleja.
* Seguir las convenciones de nomenclatura (ej. `miVariable`, `MiClase`, `MI_CONSTANTE`).
* Usar importaciones nombradas y organizarlas.

## 7. Testing y Estructura de Pruebas

El proyecto incluye una carpeta `test/` para pruebas unitarias y de integración, siguiendo los principios de la arquitectura limpia.

### Estructura de Testing

* **`test/unit/`**: Pruebas unitarias para cada capa
  * `test/unit/domain/`: Pruebas de entidades, DTOs, use cases
  * `test/unit/infrastructure/`: Pruebas de datasources, repositories, mappers, adapters
  * `test/unit/presentation/`: Pruebas de controllers, middlewares
* **`test/integration/`**: Pruebas de integración end-to-end
  * Pruebas de rutas completas
  * Pruebas de base de datos
  * Pruebas de servicios externos (con mocks)
* **`test/fixtures/`**: Datos de prueba y mocks reutilizables
* **`test/helpers/`**: Utilidades y helpers para testing

### Convenciones de Testing

* **Nomenclatura de archivos**: `[nombre-del-archivo].test.ts`
* **Framework de testing**: Jest (recomendado para TypeScript/Node.js)
* **Estructura de pruebas**:
  ```typescript
  describe('[NombreClase/Funcionalidad]', () => {
    describe('[método/funcionalidad específica]', () => {
      it('should [comportamiento esperado] when [condición]', () => {
        // Arrange, Act, Assert
      });
    });
  });
  ```

### Pruebas por Capa

#### Domain Layer (Pruebas Unitarias)

* **Entities**: Validar propiedades y comportamientos
* **DTOs**: Validar el método `create()` y `update()` con datos válidos e inválidos
* **Use Cases**: Mockear repositorios y probar lógica de negocio
  ```typescript
  // Ejemplo: CreateProductUseCase.test.ts
  const mockProductRepository = {
    create: jest.fn(),
    findByName: jest.fn()
  };
  ```

#### Infrastructure Layer (Pruebas Unitarias/Integración)

* **Mappers**: Probar conversión entre modelos Mongoose y entities
* **Datasources**: Pruebas de integración con MongoDB (usar base de datos de testing)
* **Repositories**: Probar que deleguen correctamente a datasources
* **Adapters**: Mockear servicios externos (Cloudinary, MercadoPago, etc.)

#### Presentation Layer (Pruebas de Integración)

* **Controllers**: Probar endpoints completos con supertest
* **Middlewares**: Probar autenticación, validación, etc.
* **Routes**: Pruebas end-to-end de rutas completas

### Configuración de Testing

* **Base de datos de testing**: Usar MongoDB en memoria o contenedor Docker
* **Variables de entorno**: Archivo `.env.test` para configuración de testing
* **Limpieza**: Limpiar base de datos entre pruebas
* **Mocks**: Mockear servicios externos para evitar llamadas reales

### Ejemplos de Testing por Tipo

#### DTO Testing

```typescript
describe('CreateProductDto', () => {
  describe('create', () => {
    it('should create valid DTO when all required fields are provided', () => {
      const validData = {
        name: 'Test Product',
        price: 100,
        categoryId: 'category-id'
      };
  
      const [error, dto] = CreateProductDto.create(validData);
  
      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.name).toBe(validData.name);
    });

    it('should return error when required field is missing', () => {
      const invalidData = { price: 100 };
  
      const [error, dto] = CreateProductDto.create(invalidData);
  
      expect(error).toBeDefined();
      expect(dto).toBeUndefined();
    });
  });
});
```

#### Use Case Testing

```typescript
describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockRepository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByName: jest.fn()
    } as any;
    useCase = new CreateProductUseCase(mockRepository);
  });

  it('should create product when name is unique', async () => {
    mockRepository.findByName.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(mockProductEntity);

    const result = await useCase.execute(createProductDto);

    expect(mockRepository.findByName).toHaveBeenCalledWith(createProductDto.name);
    expect(mockRepository.create).toHaveBeenCalledWith(createProductDto);
    expect(result).toEqual(mockProductEntity);
  });
});
```

#### Controller Testing (Integración)

```typescript
describe('ProductController', () => {
  let app: Express;
  
  beforeAll(async () => {
    // Setup test app and database
  });

  describe('POST /api/products', () => {
    it('should create product when valid data is provided', async () => {
      const validProduct = {
        name: 'Test Product',
        price: 100
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProduct)
        .expect(201);

      expect(response.body.name).toBe(validProduct.name);
    });
  });
});
```

### Scripts de Testing Recomendados

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration"
  }
}
```

### Instrucciones Específicas para Testing

* **Al generar tests para nuevas funcionalidades**:
  1. Crear tests unitarios para DTOs validando casos válidos e inválidos
  2. Crear tests unitarios para Use Cases mockeando dependencias
  3. Crear tests de integración para Controllers con base de datos real
  4. Crear tests para Mappers verificando transformaciones correctas
* **Cobertura mínima**: Apuntar a 80% de cobertura de código
* **Datos de prueba**: Usar factories o fixtures para generar datos consistentes
* **Isolación**: Cada test debe ser independiente y no depender de otros tests
* **Naming**: Los nombres de tests deben ser descriptivos y seguir el patrón "should [acción] when [condición]"
* En general el codigo esta bien y hay que adaptar los test

## 8. Cómo Usar Este Archivo

Por favor, revisa estas instrucciones y los patrones existentes en el código antes de generar nuevo código. Intenta seguir la estructura y convenciones aquí descritas para mantener la coherencia del proyecto.

---

*Última actualización: 13/01/2025*
