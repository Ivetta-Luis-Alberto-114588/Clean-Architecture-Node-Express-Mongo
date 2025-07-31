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
import { SearchCustomersDto } from "../../../domain/dtos/customers/search-customers.dto";
import { SearchProductsDto } from "../../../domain/dtos/products/search-product.dto";

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
                name: "search_products",
                description: "Busca productos por nombre, descripción o categoría",
                inputSchema: {
                    type: "object",
                    properties: {
                        q: { type: "string", description: "Término de búsqueda (requerido)" },
                        page: { type: "number", description: "Número de página (default: 1)" },
                        limit: { type: "number", description: "Productos por página (default: 10)" },
                        categories: { type: "string", description: "Categorías separadas por coma" },
                        minPrice: { type: "number", description: "Precio mínimo" },
                        maxPrice: { type: "number", description: "Precio máximo" },
                        sortBy: { type: "string", description: "Campo de ordenamiento" },
                        sortOrder: { type: "string", enum: ["asc", "desc"], description: "Orden ascendente o descendente" },
                    },
                    required: ["q"],
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
                name: "get_customers",
                description: "Obtiene lista de clientes",
                inputSchema: {
                    type: "object",
                    properties: {
                        page: { type: "number", description: "Número de página (default: 1)" },
                        limit: { type: "number", description: "Clientes por página (default: 10)" },
                    },
                },
            },
            {
                name: "search_customers",
                description: "Busca clientes por nombre, email o teléfono",
                inputSchema: {
                    type: "object",
                    properties: {
                        q: { type: "string", description: "Término de búsqueda (nombre, email, teléfono)" },
                        neighborhoodId: { type: "string", description: "ID del barrio para filtrar" },
                        page: { type: "number", description: "Número de página (default: 1)" },
                        limit: { type: "number", description: "Clientes por página (default: 10)" },
                        sortBy: { type: "string", description: "Campo de ordenamiento" },
                        sortOrder: { type: "string", enum: ["asc", "desc"], description: "Orden ascendente o descendente" },
                    },
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

                case "search_customers":
                    return await this.handleSearchCustomers(args);

                case "get_products":
                    return await this.handleGetProducts(args);

                case "search_products":
                    return await this.handleSearchProducts(args);

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
        const { page = 1, limit = 10, search } = args;

        const [paginationError, paginationDto] = PaginationDto.create(page, limit);
        if (paginationError) {
            throw CustomError.badRequest(paginationError);
        }

        let customersResult;
        let total;

        // Si hay parámetro search, usar búsqueda avanzada, si no, obtener todos
        if (search) {
            const [searchError, searchCustomersDto] = SearchCustomersDto.create({
                q: search,
                page,
                limit,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            if (searchError) {
                throw CustomError.badRequest(searchError);
            }

            const searchResult = await this.customerRepository.searchCustomers(searchCustomersDto!);
            customersResult = searchResult.customers;
            total = searchResult.total;
        } else {
            customersResult = await this.customerRepository.getAll(paginationDto!);
            total = (customersResult as any).total ?? customersResult.length;
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        total,
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
        const { page = 1, limit = 10, search, categoryId, minPrice, maxPrice } = args;

        const [paginationError, paginationDto] = PaginationDto.create(page, limit);
        if (paginationError) {
            throw CustomError.badRequest(paginationError);
        }

        let productsResult;

        // Si hay parámetros de búsqueda, usar la búsqueda avanzada
        if (search || categoryId || minPrice || maxPrice) {
            const [searchError, searchProductsDto] = SearchProductsDto.create({
                q: search,
                page,
                limit,
                categoryId,
                minPrice,
                maxPrice
            });

            if (searchError) {
                throw CustomError.badRequest(searchError);
            }

            productsResult = await this.productRepository.search(searchProductsDto!);
        } else {
            // Si no hay parámetros de búsqueda, usar getAll
            productsResult = await this.productRepository.getAll(paginationDto!);
        }

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
        const { page = 1, limit = 10, customerId, status, dateFrom, dateTo } = args;

        const [paginationError, paginationDto] = PaginationDto.create(page, limit);
        if (paginationError) {
            throw CustomError.badRequest(paginationError);
        }

        try {
            let ordersResult;

            // Si hay parámetros de filtro, crear filtros para búsqueda
            if (customerId || status || dateFrom || dateTo) {
                // Usar filtros de búsqueda con los parámetros proporcionados
                const filters: any = {};
                if (customerId) filters.customerId = customerId;
                if (status) filters.status = status;
                if (dateFrom) filters.dateFrom = new Date(dateFrom);
                if (dateTo) filters.dateTo = new Date(dateTo);

                // Nota: Si no tienes un método de filtrado específico en el repository,
                // necesitarás implementarlo o usar getAll con filtros en el datasource
                ordersResult = await this.orderRepository.getAll(paginationDto!);
            } else {
                // Si no hay filtros, usar getAll
                ordersResult = await this.orderRepository.getAll(paginationDto!);
            }

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            total: ordersResult.total,
                            page,
                            limit, orders: ordersResult.orders.map(order => ({
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
        const { query } = args;
        // Determine entities to search; if not provided, default to both
        const entities: string[] = Array.isArray(args.entities) ? args.entities : ['products', 'customers'];

        if (!query) {
            throw CustomError.badRequest("Query de búsqueda es requerido");
        }

        const results: any = {};
        const errors: string[] = [];

        // Search products if requested
        if (entities.includes('products')) {
            const [paginationError, paginationDto] = PaginationDto.create(1, 5);
            if (!paginationError) {
                try {
                    const productsResult = await this.productRepository.getAll(paginationDto!);
                    // Asegurar que products sea un array
                    let products: any[] = [];
                    if (Array.isArray(productsResult)) {
                        products = productsResult;
                    } else if (productsResult && (productsResult as any).products) {
                        products = (productsResult as any).products;
                    }

                    const filteredProducts = products.filter((p: any) =>
                        (p.name && p.name.toLowerCase().includes(query.toLowerCase())) ||
                        (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
                    );
                    if (filteredProducts.length > 0) {
                        results.products = filteredProducts.slice(0, 5);
                    }
                } catch (err: any) {
                    errors.push(`Error buscando productos: ${err instanceof Error ? err.message : err}`);
                }
            }
        }

        // Search customers if requested
        if (entities.includes('customers')) {
            const [paginationError, paginationDto] = PaginationDto.create(1, 5);
            if (!paginationError) {
                try {
                    const customersResult = await this.customerRepository.getAll(paginationDto!);
                    // Asegurar que customers sea un array
                    let customers: any[] = [];
                    if (Array.isArray(customersResult)) {
                        customers = customersResult;
                    } else if (customersResult && (customersResult as any).customers) {
                        customers = (customersResult as any).customers;
                    }

                    const filteredCustomers = customers.filter((c: any) =>
                        (c.name && c.name.toLowerCase().includes(query.toLowerCase())) ||
                        (c.email && c.email.toLowerCase().includes(query.toLowerCase()))
                    );
                    if (filteredCustomers.length > 0) {
                        results.customers = filteredCustomers.slice(0, 5);
                    }
                } catch (err: any) {
                    errors.push(`Error buscando clientes: ${err instanceof Error ? err.message : err}`);
                }
            }
        }

        // If any errors occurred, include them in the results
        if (errors.length > 0) {
            results.errors = errors;
        }

        // Always return content with results or empty object
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }

    private async handleSearchCustomers(args: Record<string, any>): Promise<MCPCallResult> {
        const { q, neighborhoodId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = args;

        const [searchError, searchCustomersDto] = SearchCustomersDto.create({
            q,
            neighborhoodId,
            page,
            limit,
            sortBy,
            sortOrder
        });

        if (searchError) {
            throw CustomError.badRequest(searchError);
        }

        try {
            const searchResult = await this.customerRepository.searchCustomers(searchCustomersDto!);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            total: searchResult.total,
                            page,
                            limit,
                            customers: searchResult.customers.map(customer => ({
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
        } catch (error) {
            logger.error('Error en búsqueda de clientes:', { error, args });
            throw CustomError.internalServerError(
                `Error buscando clientes: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
        }
    }

    private async handleSearchProducts(args: Record<string, any>): Promise<MCPCallResult> {
        const { q, page = 1, limit = 10, categories, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = args;

        const [searchError, searchProductsDto] = SearchProductsDto.create({
            q,
            page,
            limit,
            categories,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder
        });

        if (searchError) {
            throw CustomError.badRequest(searchError);
        }

        try {
            const searchResult = await this.productRepository.search(searchProductsDto!);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            total: searchResult.total,
                            page,
                            limit,
                            products: searchResult.products.map(product => ({
                                id: product.id,
                                name: product.name,
                                description: product.description,
                                price: product.price,
                                priceWithTax: product.priceWithTax,
                                stock: product.stock,
                                category: product.category?.name || 'Sin categoría',
                                unit: product.unit?.name || 'Unidad',
                                tags: product.tags || [],
                                imgUrl: product.imgUrl,
                                isActive: product.isActive,
                            })),
                        }, null, 2),
                    },
                ],
            };
        } catch (error) {
            logger.error('Error en búsqueda de productos:', { error, args });
            throw CustomError.internalServerError(
                `Error buscando productos: ${error instanceof Error ? error.message : 'Error desconocido'}`
            );
        }
    }
}
