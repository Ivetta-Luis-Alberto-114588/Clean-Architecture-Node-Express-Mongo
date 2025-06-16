// src/infrastructure/datasources/mcp/mcp.datasource.impl.ts
import { MCPDatasource } from "../../../domain/datasources/mcp/mcp.datasource";
import { MCPToolEntity, MCPCallResult } from "../../../domain/entities/mcp/mcp.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import logger from "../../../configs/logger";

// Repositorios existentes
import { ProductRepository } from "../../../domain/repositories/products/product.repository";
import { CustomerRepository } from "../../../domain/repositories/customers/customer.repository";
import { OrderRepository } from "../../../domain/repositories/order/order.repository";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";

export class MCPDataSourceImpl extends MCPDatasource {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly orderRepository: OrderRepository
  ) {
    super();
  }

  async getAvailableTools(): Promise<MCPToolEntity[]> {
    return [
      {
        name: "get_customers",
        description: "Obtiene lista de clientes con filtros opcionales",
        inputSchema: {
          type: "object",
          properties: {
            page: { type: "number", description: "Número de página (default: 1)" },
            limit: { type: "number", description: "Clientes por página (default: 10)" },
            search: { type: "string", description: "Buscar por nombre o email" },
          },
        },
      },
      {
        name: "get_customer_by_id",
        description: "Obtiene un cliente específico por ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del cliente" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_products",
        description: "Obtiene lista de productos con filtros opcionales",
        inputSchema: {
          type: "object",
          properties: {
            page: { type: "number", description: "Número de página (default: 1)" },
            limit: { type: "number", description: "Productos por página (default: 10)" },
            search: { type: "string", description: "Término de búsqueda en nombre/descripción" },
            categoryId: { type: "string", description: "ID de categoría para filtrar" },
            minPrice: { type: "number", description: "Precio mínimo" },
            maxPrice: { type: "number", description: "Precio máximo" },
          },
        },
      },
      {
        name: "get_product_by_id",
        description: "Obtiene un producto específico por ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID del producto" },
          },
          required: ["id"],
        },
      },
      {
        name: "get_orders",
        description: "Obtiene lista de pedidos con filtros opcionales",
        inputSchema: {
          type: "object",
          properties: {
            page: { type: "number", description: "Número de página (default: 1)" },
            limit: { type: "number", description: "Pedidos por página (default: 10)" },
            customerId: { type: "string", description: "ID del cliente para filtrar" },
            status: { type: "string", description: "Estado del pedido" },
            dateFrom: { type: "string", description: "Fecha desde (YYYY-MM-DD)" },
            dateTo: { type: "string", description: "Fecha hasta (YYYY-MM-DD)" },
          },
        },
      },
      {
        name: "search_database",
        description: "Búsqueda general en productos y clientes",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Término de búsqueda" },
            entities: { 
              type: "array", 
              items: { type: "string", enum: ["products", "customers"] },
              description: "Entidades donde buscar (default: ['products', 'customers'])" 
            },
          },
          required: ["query"],
        },
      },
    ];
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<MCPCallResult> {
    try {
      logger.info(`Ejecutando herramienta MCP: ${toolName}`, { args });

      switch (toolName) {
        case "get_customers":
          return await this.handleGetCustomers(args);
        
        case "get_customer_by_id":
          return await this.handleGetCustomerById(args);
        
        case "get_products":
          return await this.handleGetProducts(args);
        
        case "get_product_by_id":
          return await this.handleGetProductById(args);
        
        case "get_orders":
          return await this.handleGetOrders(args);
        
        case "search_database":
          return await this.handleSearchDatabase(args);

        default:
          throw CustomError.badRequest(`Herramienta desconocida: ${toolName}`);
      }
    } catch (error) {
      logger.error(`Error ejecutando herramienta MCP ${toolName}:`, { error, args });
      
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error ejecutando ${toolName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  private async handleGetCustomers(args: Record<string, any>): Promise<MCPCallResult> {
    const { page = 1, limit = 10 } = args;
    
    const [paginationError, paginationDto] = PaginationDto.create(page, limit);
    if (paginationError) {
      throw CustomError.badRequest(paginationError);
    }

    const customersResult = await this.customerRepository.getAll(paginationDto!);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total: customersResult.length, // Temporal hasta revisar el retorno del repository
            page,
            limit,
            customers: customersResult.map(customer => ({
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              neighborhood: customer.neighborhood?.name || 'No especificado',
              city: customer.neighborhood?.city?.name || 'No especificado',
              isActive: customer.isActive,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetCustomerById(args: Record<string, any>): Promise<MCPCallResult> {
    const { id } = args;
    
    if (!id) {
      throw CustomError.badRequest("ID del cliente es requerido");
    }

    try {
      const customer = await this.customerRepository.findById(id);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              neighborhood: customer.neighborhood?.name || 'No especificado',
              city: customer.neighborhood?.city?.name || 'No especificado',
              isActive: customer.isActive,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Cliente con ID ${id} no encontrado`,
          },
        ],
      };
    }
  }
  private async handleGetProducts(args: Record<string, any>): Promise<MCPCallResult> {
    const { page = 1, limit = 10 } = args;
    
    const [paginationError, paginationDto] = PaginationDto.create(page, limit);
    if (paginationError) {
      throw CustomError.badRequest(paginationError);
    }

    const productsResult = await this.productRepository.getAll(paginationDto!);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            total: productsResult.total,
            page,
            limit,
            products: productsResult.products.map(product => ({
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              priceWithTax: product.priceWithTax,
              stock: product.stock,
              category: product.category?.name || 'Sin categoría',
              unit: product.unit?.name || 'Sin unidad',
              tags: product.tags,
              isActive: product.isActive,
            })),
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetProductById(args: Record<string, any>): Promise<MCPCallResult> {
    const { id } = args;
    
    if (!id) {
      throw CustomError.badRequest("ID del producto es requerido");
    }

    try {
      const product = await this.productRepository.findById(id);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              priceWithTax: product.priceWithTax,
              stock: product.stock,
              category: product.category?.name || 'Sin categoría',
              unit: product.unit?.name || 'Sin unidad',
              tags: product.tags,
              isActive: product.isActive,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Producto con ID ${id} no encontrado`,
          },
        ],
      };
    }
  }
  private async handleGetOrders(args: Record<string, any>): Promise<MCPCallResult> {
    const { page = 1, limit = 10 } = args;
    
    const [paginationError, paginationDto] = PaginationDto.create(page, limit);
    if (paginationError) {
      throw CustomError.badRequest(paginationError);
    }

    try {
      const ordersResult = await this.orderRepository.getAll(paginationDto!);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              total: ordersResult.total,
              page,
              limit,              orders: ordersResult.orders.map(order => ({
                id: order.id,
                customer: order.customer ? {
                  id: order.customer.id,
                  name: order.customer.name,
                  email: order.customer.email
                } : null,
                subtotal: order.subtotal,
                total: order.total,
                status: order.status?.name || 'Sin estado',
                date: order.date,
                itemsCount: order.items?.length || 0,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Error obteniendo pedidos: " + (error instanceof Error ? error.message : 'Error desconocido'),
          },
        ],
      };
    }
  }
  private async handleSearchDatabase(args: Record<string, any>): Promise<MCPCallResult> {
    const { query, entities = ['products', 'customers'] } = args;
    
    if (!query) {
      throw CustomError.badRequest("Query de búsqueda es requerido");
    }

    const results: any = {};

    try {
      if (entities.includes('products')) {
        const [paginationError, paginationDto] = PaginationDto.create(1, 5);
        if (!paginationError) {
          const productsResult = await this.productRepository.getAll(paginationDto!);
          // Filtro simple por nombre/descripción
          const filteredProducts = productsResult.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
          );
          results.products = filteredProducts.slice(0, 5);
        }
      }

      if (entities.includes('customers')) {
        const [paginationError, paginationDto] = PaginationDto.create(1, 5);
        if (!paginationError) {
          const customersResult = await this.customerRepository.getAll(paginationDto!);
          // Filtro simple por nombre/email
          const filteredCustomers = customersResult.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())
          );
          results.customers = filteredCustomers.slice(0, 5);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: "Error en búsqueda: " + (error instanceof Error ? error.message : 'Error desconocido'),
          },
        ],
      };
    }
  }
}
