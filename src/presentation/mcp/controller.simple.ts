// src/presentation/mcp/controller.simple.ts
import { Request, Response } from 'express';
import logger from '../../configs/logger';

export class SimpleMCPController {

    // Endpoint de salud
    health = (req: Request, res: Response) => {
        try {
            return res.status(200).json({
                status: 'OK',
                service: 'MCP Service',
                timestamp: new Date().toISOString(),
                message: 'MCP service is healthy'
            });
        } catch (error) {
            return res.status(500).json({ error: 'Health check failed' });
        }
    };

    // Listar herramientas disponibles
    listTools = (req: Request, res: Response) => {
        try {
            const tools = [
                {
                    name: "get_products",
                    description: "Obtiene lista de productos con filtros opcionales",
                    endpoint: "GET /api/v1/products",
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
                    endpoint: "GET /api/v1/products/{id}",
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
                    description: "Obtiene lista de clientes con filtros opcionales",
                    endpoint: "GET /api/v1/admin/customers",
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
                    endpoint: "GET /api/v1/admin/customers/{id}",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "string", description: "ID del cliente" },
                        },
                        required: ["id"],
                    },
                },
                {
                    name: "get_orders",
                    description: "Obtiene lista de pedidos con filtros opcionales",
                    endpoint: "GET /api/v1/admin/orders",
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
            ];

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Tools',
                timestamp: new Date().toISOString(),
                tools: tools,
                usage: {
                    description: "Estas herramientas se mapean a endpoints REST existentes",
                    note: "Para usar las herramientas, puedes llamar directamente a los endpoints REST correspondientes o usar el endpoint /tools/call"
                }
            });

        } catch (error) {
            logger.error('Error listing tools:', error);
            return res.status(500).json({
                error: 'Error listing tools',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    // Documentación de una herramienta específica
    getToolDocumentation = (req: Request, res: Response) => {
        try {
            const { toolName } = req.params;

            const toolExamples: Record<string, any> = {
                get_products: {
                    description: "Lista productos con paginación y filtros",
                    restEndpoint: "GET /api/v1/products",
                    examples: [
                        {
                            title: "Listar primeros 10 productos",
                            restCall: "GET /api/v1/products?page=1&limit=10",
                            mcpCall: { toolName: "get_products", args: { page: 1, limit: 10 } }
                        },
                        {
                            title: "Buscar productos por nombre",
                            restCall: "GET /api/v1/products?search=laptop&page=1&limit=5",
                            mcpCall: { toolName: "get_products", args: { search: "laptop", page: 1, limit: 5 } }
                        },
                        {
                            title: "Filtrar por rango de precio",
                            restCall: "GET /api/v1/products?minPrice=100&maxPrice=500",
                            mcpCall: { toolName: "get_products", args: { minPrice: 100, maxPrice: 500 } }
                        }
                    ]
                },
                get_customers: {
                    description: "Lista clientes con paginación y filtros",
                    restEndpoint: "GET /api/v1/admin/customers",
                    examples: [
                        {
                            title: "Listar primeros 10 clientes",
                            restCall: "GET /api/v1/admin/customers?page=1&limit=10",
                            mcpCall: { toolName: "get_customers", args: { page: 1, limit: 10 } }
                        },
                        {
                            title: "Buscar clientes por nombre o email",
                            restCall: "GET /api/v1/admin/customers?search=juan",
                            mcpCall: { toolName: "get_customers", args: { search: "juan" } }
                        }
                    ]
                },
                get_product_by_id: {
                    description: "Obtiene detalles de un producto específico",
                    restEndpoint: "GET /api/v1/products/{id}",
                    examples: [
                        {
                            title: "Obtener producto por ID",
                            restCall: "GET /api/v1/products/60f8b4b8e0b2a3a4b8b4b8b4",
                            mcpCall: { toolName: "get_product_by_id", args: { id: "60f8b4b8e0b2a3a4b8b4b8b4" } }
                        }
                    ]
                }
            };

            if (toolExamples[toolName]) {
                return res.status(200).json({
                    status: 'OK',
                    service: 'MCP Tool Documentation',
                    timestamp: new Date().toISOString(),
                    toolName,
                    ...toolExamples[toolName]
                });
            } else {
                return res.status(404).json({
                    error: 'Tool not found',
                    availableTools: Object.keys(toolExamples)
                });
            }

        } catch (error) {
            logger.error('Error getting tool documentation:', error);
            return res.status(500).json({ error: 'Error getting tool documentation' });
        }
    };

    // Placeholder para llamar herramientas (redirige a endpoints REST)
    callTool = (req: Request, res: Response) => {
        try {
            const { toolName, args } = req.body;

            if (!toolName) {
                return res.status(400).json({ error: 'Tool name is required' });
            }

            // Mapeo de herramientas a endpoints REST
            const toolEndpointMap: Record<string, string> = {
                get_products: '/api/v1/products',
                get_product_by_id: '/api/v1/products',
                get_customers: '/api/v1/admin/customers',
                get_customer_by_id: '/api/v1/admin/customers',
                get_orders: '/api/v1/admin/orders'
            };

            const endpoint = toolEndpointMap[toolName];
            if (!endpoint) {
                return res.status(400).json({
                    error: `Unknown tool: ${toolName}`,
                    availableTools: Object.keys(toolEndpointMap)
                });
            }

            // Construir URL con parámetros
            let restUrl = endpoint;
            if (toolName.includes('_by_id') && args?.id) {
                restUrl += `/${args.id}`;
            } else if (args) {
                const params = new URLSearchParams(args).toString();
                if (params) {
                    restUrl += `?${params}`;
                }
            }

            return res.status(200).json({
                status: 'OK',
                service: 'MCP Tool Call',
                timestamp: new Date().toISOString(),
                toolName,
                redirectTo: {
                    method: toolName.includes('_by_id') ? 'GET' : 'GET',
                    url: restUrl,
                    fullUrl: `${req.protocol}://${req.get('host')}${restUrl}`
                },
                message: `Para obtener los datos reales, haz una petición ${toolName.includes('_by_id') ? 'GET' : 'GET'} a: ${restUrl}`,
                args
            });

        } catch (error) {
            logger.error('Error calling tool:', error);
            return res.status(500).json({ error: 'Error calling tool' });
        }
    };
}
