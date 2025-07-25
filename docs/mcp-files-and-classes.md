# Archivos y Clases del Sistema MCP Inteligente

## Índice de Archivos por Capa

### 📁 Presentation Layer (HTTP/Controllers)

#### `src/presentation/mcp/routes.mcp.ts`
**Propósito**: Configuración de rutas HTTP y inyección de dependencias

**Clase Principal**: `MCPRoutes`

**Métodos Clave**:
- `static get getMCPRoutes(): Router`

**Responsabilidades**:
- Configurar todas las dependencias (DataSources, Repositories, Use Cases)
- Inicializar el MCPController
- Definir la ruta POST `/chat` para detección inteligente
- Configurar middleware y manejo de errores

**Dependencias Inyectadas**:
```typescript
// DataSources
const productDataSource = new ProductMongoDataSourceImpl();
const customerDataSource = new CustomerMongoDataSourceImpl();
const orderDataSource = new OrderMongoDataSourceImpl();

// Repositories
const productRepository = new ProductRepositoryImpl(productDataSource);
const customerRepository = new CustomerRepositoryImpl(customerDataSource);
const orderRepository = new OrderRepositoryImpl(orderDataSource);

// MCP Layer
const mcpDataSource = new MCPDataSourceImpl(productRepository, customerRepository, orderRepository);
const mcpRepository = new MCPRepositoryImpl(mcpDataSource);

// Use Cases
const listToolsUseCase = new ListToolsUseCase(mcpRepository);
const callToolUseCase = new CallToolUseCase(mcpRepository);

// Controller
const controller = new MCPController(listToolsUseCase, callToolUseCase, !isTestEnvironment);
```

---

#### `src/presentation/mcp/controller.mcp.ts`
**Propósito**: Controlador principal con toda la lógica de detección inteligente

**Clase Principal**: `MCPController`

**Constructor**:
```typescript
constructor(
    private listToolsUseCase: ListToolsUseCase,
    private callToolUseCase: CallToolUseCase,
    enableCleanupInterval: boolean = true
)
```

**Métodos Principales**:

##### 🎯 `handleChatMessage(req: Request, res: Response)`
- **Propósito**: Punto de entrada para chat inteligente
- **Input**: `{message: string}`
- **Output**: `{success: boolean, message: string, tool_used: string, tool_params: object}`
- **Flujo**:
  1. Validar entrada
  2. Detectar herramientas requeridas
  3. Extraer parámetros
  4. Ejecutar herramienta automáticamente
  5. Formatear respuesta
  6. Devolver JSON

##### 🧠 `detectRequiredTools(message: string): string[]`
- **Propósito**: Analizar mensaje y determinar qué herramientas usar
- **Lógica**:
  ```typescript
  // PRODUCTOS - Específico
  const productSearchTerm = this.extractProductSearchTerm(lowerMessage);
  if (productSearchTerm) return ['search_products'];
  
  // PRODUCTOS - General
  if (lowerMessage.includes('producto') || lowerMessage.includes('disponible')) {
      return ['get_products'];
  }
  
  // CLIENTES - Específico
  const customerSearchTerm = this.extractCustomerSearchTerm(lowerMessage);
  if (customerSearchTerm) return ['search_customers'];
  
  // CLIENTES - General
  if (lowerMessage.includes('cliente')) return ['get_customers'];
  
  // ÓRDENES - Con filtros
  const orderParams = this.extractOrderSearchParams(lowerMessage);
  if (orderParams) return ['get_orders'];
  ```

##### 🔍 `extractProductSearchTerm(message: string): string | null`
- **Propósito**: Extraer términos específicos de productos usando regex
- **Patrones Regex**:
  ```typescript
  const patterns = [
      /(?:precio de (?:la|las|el|los)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
      /(?:cuanto cuesta (?:la|las|el|los)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
      /(?:costo de (?:la|las|el|los)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
      /(?:valor de (?:la|las|el|los)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
      /(?:información sobre (?:la|las|el|los)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
      /(?:busco\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i,
      /(?:quiero\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+)/i
  ];
  ```

##### 👤 `extractCustomerSearchTerm(message: string): string | null`
- **Propósito**: Extraer términos específicos de clientes
- **Patrones Regex**:
  ```typescript
  const patterns = [
      /(?:buscar cliente (?:llamado|con nombre|que se llama)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
      /(?:cliente (?:llamado|con nombre|que se llama)\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
      /(?:información del cliente\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
      /(?:datos del cliente\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i,
      /(?:cliente con email\s+)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /(?:busco al cliente\s+)([a-zA-ZáéíóúñÁÉÍÓÚÑ\s@.]+)/i
  ];
  ```

##### 📋 `extractOrderSearchParams(message: string): any`
- **Propósito**: Extraer filtros para órdenes (estado, fechas)
- **Detecta**:
  - Estados: "pendientes", "completados", "cancelados"
  - Fechas: "desde 2024-01-15", "hasta 2024-01-20", "del día 2024-01-15"

##### ✅ `isValidProductTerm(term: string): boolean`
- **Propósito**: Validar si un término extraído es un producto válido
- **Lista de productos válidos**:
  ```typescript
  const validProductTerms = [
      'empanada', 'empanadas', 'pizza', 'pizzas', 'lomito', 'lomitos',
      'picada', 'picadas', 'combo', 'combos', 'margarita', 'provenzal',
      'albaca', 'bufala', 'cherry', 'arabes', 'casera'
  ];
  ```

##### ✅ `isValidCustomerTerm(term: string): boolean`
- **Propósito**: Validar términos de búsqueda de clientes
- **Valida**:
  - Emails con regex
  - Nombres con al menos 2 caracteres y letras

##### 📝 `extractParametersFromMessage(message: string, tool: string): any`
- **Propósito**: Construir parámetros específicos para cada herramienta
- **Switch por herramienta**:
  ```typescript
  switch (tool) {
      case 'search_products':
          params.q = extractedTerm;
          params.page = 1;
          params.limit = 10;
          break;
      case 'search_customers':
          params.q = extractedTerm;
          params.page = 1;
          params.limit = 10;
          break;
      case 'get_orders':
          Object.assign(params, extractedFilters);
          params.page = 1;
          params.limit = 10;
          break;
  }
  ```

##### ⚡ `executeToolAutomatically(tool: string, params: any): Promise<{success: boolean, data?: any, error?: string}>`
- **Propósito**: Ejecutar herramienta y manejar errores
- **Delega a**: `this.callToolUseCase.execute(tool, params)`

##### 🎨 `formatToolResultForUser(data: any, tool: string): string`
- **Propósito**: Formatear respuesta para consumo humano
- **Switch por tipo de herramienta**:
  ```typescript
  switch (tool) {
      case 'get_products':
      case 'search_products':
          return this.formatProductsResponse(data);
      case 'get_customers':
      case 'search_customers':
          return this.formatCustomersResponse(data);
      case 'get_orders':
          return this.formatOrdersResponse(data);
  }
  ```

##### 🍕 `formatProductsResponse(data: any): string`
- **Propósito**: Formatear lista de productos con emojis
- **Formato de salida**:
  ```
  🍕 **Nuestros Productos Disponibles** (X productos en total):
  
  **1. Nombre del Producto**
     📝 Descripción del producto
     💰 Precio: $X.XX
     📦 Stock: X unidades
     🏷️ Categoría: X
     🏆 Etiquetas: X, Y, Z
  
  💬 ¿Te interesa algún producto en particular? ¡Puedo darte más información!
  ```

##### 👥 `formatCustomersResponse(data: any): string`
- **Propósito**: Formatear lista de clientes
- **Formato**:
  ```
  👥 **Clientes Registrados** (X clientes en total):
  
  **1. Nombre del Cliente**
     📧 Email: email@example.com
     📱 Teléfono: +123456789
  ```

##### 📋 `formatOrdersResponse(data: any): string`
- **Propósito**: Formatear lista de pedidos
- **Formato**:
  ```
  📋 **Pedidos Registrados** (X pedidos en total):
  
  **1. Pedido #ID**
     💰 Total: $X.XX
     📅 Fecha: DD/MM/YYYY
     📊 Estado: Estado
  ```

---

### 📁 Domain Layer (Lógica de Negocio)

#### `src/domain/use-cases/mcp/call-tool.use-case.ts`
**Propósito**: Orquestar la ejecución de herramientas MCP

**Clase Principal**: `CallToolUseCase`

**Constructor**:
```typescript
constructor(private mcpRepository: MCPRepository) {}
```

**Método Principal**:
```typescript
async execute(toolName: string, params: any): Promise<any> {
    // Validaciones de negocio
    if (!toolName) throw new Error('Tool name is required');
    
    // Delegar al repository
    return await this.mcpRepository.callTool(toolName, params);
}
```

---

#### `src/domain/use-cases/mcp/list-tools.use-case.ts`
**Propósito**: Listar herramientas disponibles

**Clase Principal**: `ListToolsUseCase`

**Método Principal**:
```typescript
async execute(): Promise<any> {
    return await this.mcpRepository.listTools();
}
```

---

#### `src/domain/repositories/mcp.repository.ts`
**Propósito**: Interface del repository MCP (contrato)

**Interface**: `MCPRepository`

**Métodos Definidos**:
```typescript
interface MCPRepository {
    listTools(): Promise<any>;
    callTool(toolName: string, params: any): Promise<any>;
}
```

---

### 📁 Infrastructure Layer (Implementaciones)

#### `src/infrastructure/repositories/mcp/mcp.repository.impl.ts`
**Propósito**: Implementación concreta del repository MCP

**Clase Principal**: `MCPRepositoryImpl`

**Constructor**:
```typescript
constructor(private datasource: MCPDataSource) {}
```

**Métodos Implementados**:
```typescript
async listTools(): Promise<any> {
    return await this.datasource.listTools();
}

async callTool(toolName: string, params: any): Promise<any> {
    return await this.datasource.callTool(toolName, params);
}
```

---

#### `src/infrastructure/datasources/mcp/mcp.datasource.impl.ts`
**Propósito**: Implementación del datasource que orquesta otras capas

**Clase Principal**: `MCPDataSourceImpl`

**Constructor**:
```typescript
constructor(
    private productRepository: ProductRepository,
    private customerRepository: CustomerRepository,
    private orderRepository: OrderRepository
) {}
```

**Métodos de Herramientas**:

##### `listTools(): Promise<any>`
- **Propósito**: Devolver lista de herramientas disponibles
- **Retorna**:
  ```typescript
  {
      tools: [
          {
              name: "get_products",
              description: "Lista general de productos disponibles con paginación",
              input_schema: {
                  type: "object",
                  properties: {
                      page: { type: "number", description: "Número de página" },
                      limit: { type: "number", description: "Elementos por página" }
                  }
              }
          },
          // ... más herramientas
      ]
  }
  ```

##### `callTool(toolName: string, params: any): Promise<any>`
- **Propósito**: Router principal para ejecutar herramientas
- **Switch por herramienta**:
  ```typescript
  switch (toolName) {
      case 'get_products': return await this.getProducts(params);
      case 'search_products': return await this.searchProducts(params);
      case 'get_customers': return await this.getCustomers(params);
      case 'search_customers': return await this.searchCustomers(params);
      case 'get_orders': return await this.getOrders(params);
      default: throw new Error(`Unknown tool: ${toolName}`);
  }
  ```

##### `getProducts(params: any): Promise<any>`
- **Propósito**: Obtener lista general de productos
- **Parámetros**: `{page?: number, limit?: number}`
- **Proceso**:
  1. Crear `PaginationDto`
  2. Llamar a `productRepository.getPaginated()`
  3. Formatear respuesta

##### `searchProducts(params: any): Promise<any>`
- **Propósito**: Buscar productos específicos
- **Parámetros**: `{q: string, page?: number, limit?: number}`
- **Proceso**:
  1. Validar que `q` esté presente
  2. Crear `PaginationDto`
  3. Llamar a `productRepository.searchByName()`
  4. Formatear respuesta

##### `getCustomers(params: any): Promise<any>`
- **Propósito**: Obtener lista general de clientes
- **Similar a `getProducts` pero para clientes**

##### `searchCustomers(params: any): Promise<any>`
- **Propósito**: Buscar clientes específicos
- **Parámetros**: `{q: string, page?: number, limit?: number}`
- **Proceso**:
  1. Validar parámetros de búsqueda
  2. Llamar a `customerRepository.searchByQuery()`
  3. Formatear respuesta

##### `getOrders(params: any): Promise<any>`
- **Propósito**: Obtener órdenes con filtros opcionales
- **Parámetros**: `{status?: string, dateFrom?: string, dateTo?: string, page?: number, limit?: number}`
- **Proceso**:
  1. Construir filtros
  2. Crear `PaginationDto`
  3. Llamar a `orderRepository.getFilteredOrders()`
  4. Formatear respuesta

---

### 📁 Product Repository Layer

#### `src/infrastructure/repositories/products/product.repository.impl.ts`
**Propósito**: Implementación del repository de productos

**Clase Principal**: `ProductRepositoryImpl`

**Métodos Clave**:
```typescript
async getPaginated(pagination: PaginationDto): Promise<{items: ProductEntity[], total: number}> {
    return await this.datasource.getPaginated(pagination);
}

async searchByName(query: string, pagination: PaginationDto): Promise<{items: ProductEntity[], total: number}> {
    return await this.datasource.searchByName(query, pagination);
}
```

---

#### `src/infrastructure/datasources/products/product.mongo.datasource.impl.ts`
**Propósito**: Acceso a datos de productos en MongoDB

**Clase Principal**: `ProductMongoDataSourceImpl`

**Métodos MongoDB**:

##### `getPaginated(pagination: PaginationDto): Promise<{items: ProductEntity[], total: number}>`
- **Query MongoDB**:
  ```typescript
  const filter = { isActive: true };
  const total = await ProductModel.countDocuments(filter);
  const products = await ProductModel
      .find(filter)
      .populate('category')
      .populate('unit')
      .populate('tags')
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit);
  ```

##### `searchByName(query: string, pagination: PaginationDto): Promise<{items: ProductEntity[], total: number}>`
- **Query MongoDB con filtro**:
  ```typescript
  const searchFilter = {
      name: { $regex: query, $options: 'i' },
      isActive: true
  };
  const total = await ProductModel.countDocuments(searchFilter);
  const products = await ProductModel
      .find(searchFilter)
      .populate('category')
      .populate('unit')
      .populate('tags')
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit);
  ```

---

### 📁 Data Models (MongoDB Schemas)

#### `src/data/mongodb/models/products/product.model.ts`
**Propósito**: Schema de Mongoose para productos

**Esquema Principal**:
```typescript
const productSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    taxRate: { type: Number, default: 21 },
    isActive: { type: Boolean, default: true },
    images: [String]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para precio con impuestos
productSchema.virtual('priceWithTax').get(function() {
    return this.price * (1 + this.taxRate / 100);
});
```

---

### 📁 Mappers (Transformación de Datos)

#### `src/infrastructure/mappers/products/product.mapper.ts`
**Propósito**: Convertir entre documentos MongoDB y entidades de dominio

**Clase Principal**: `ProductMapper`

**Método Principal**:
```typescript
static fromObjectToEntity(object: any): ProductEntity {
    return new ProductEntity(
        object._id?.toString() || object.id,
        object.name,
        object.description,
        object.price,
        object.stock,
        object.category?.name || object.category,
        object.unit?.name || object.unit,
        object.tags?.map((tag: any) => tag.name || tag) || [],
        object.taxRate || 21,
        object.isActive !== false,
        object.images || [],
        object.priceWithTax || (object.price * (1 + (object.taxRate || 21) / 100)),
        object.createdAt,
        object.updatedAt
    );
}
```

---

## Flujo de Datos Completo

### Ejemplo: "¿Cuál es el precio de las empanadas?"

```
1. HTTP Request → MCPRoutes.getMCPRoutes()
2. Router → MCPController.handleChatMessage()
3. Controller → detectRequiredTools("¿Cuál es el precio de las empanadas?")
4. Detector → extractProductSearchTerm() → "empanadas"
5. Validator → isValidProductTerm("empanadas") → true
6. Decision → "search_products"
7. Extractor → extractParametersFromMessage() → {q: "empanadas", page: 1, limit: 10}
8. Executor → executeToolAutomatically("search_products", params)
9. UseCase → CallToolUseCase.execute("search_products", params)
10. Repository → MCPRepositoryImpl.callTool("search_products", params)
11. DataSource → MCPDataSourceImpl.searchProducts(params)
12. Validation → PaginationDto.create(1, 10)
13. Repository → ProductRepositoryImpl.searchByName("empanadas", pagination)
14. DataSource → ProductMongoDataSourceImpl.searchByName("empanadas", pagination)
15. MongoDB → ProductModel.find({name: {$regex: "empanadas", $options: "i"}, isActive: true})
16. Populate → .populate('category').populate('unit').populate('tags')
17. Results → [empanadas_arabes_document]
18. Mapper → ProductMapper.fromObjectToEntity() → [ProductEntity]
19. Response → {items: [ProductEntity], total: 1}
20. Format → MCPDataSourceImpl formats to {products: [...], total: 1, page: 1, limit: 10}
21. Return → Back through all layers
22. Formatter → formatToolResultForUser(data, "search_products")
23. Template → formatProductsResponse() → "🍕 **Nuestros Productos...**"
24. JSON → {success: true, message: "🍕...", tool_used: "search_products", tool_params: {...}}
25. HTTP Response → Cliente recibe respuesta formateada
```

---

## Resumen de Responsabilidades

| **Capa** | **Archivo** | **Responsabilidad Principal** |
|----------|-------------|-------------------------------|
| **Presentation** | `routes.mcp.ts` | Configurar dependencias y rutas HTTP |
| **Presentation** | `controller.mcp.ts` | Detección inteligente y formateo de respuestas |
| **Domain** | `call-tool.use-case.ts` | Lógica de negocio para ejecución de herramientas |
| **Domain** | `mcp.repository.ts` | Contrato/Interface para acceso a datos MCP |
| **Infrastructure** | `mcp.repository.impl.ts` | Implementación del repository MCP |
| **Infrastructure** | `mcp.datasource.impl.ts` | Orquestación de herramientas y coordinación de repositorios |
| **Infrastructure** | `product.repository.impl.ts` | Implementación específica para productos |
| **Infrastructure** | `product.mongo.datasource.impl.ts` | Acceso directo a MongoDB para productos |
| **Data** | `product.model.ts` | Schema de MongoDB para productos |
| **Infrastructure** | `product.mapper.ts` | Transformación entre modelos y entidades |

Este sistema implementa correctamente los principios de **Clean Architecture** con separación clara de responsabilidades y flujo de dependencias hacia el dominio.
