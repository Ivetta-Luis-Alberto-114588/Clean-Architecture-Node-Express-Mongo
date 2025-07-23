// src/presentation/mcp/routes.mcp.ts
import { Router, Request, Response } from "express";
import { MCPController } from "./controller.mcp";

// Importar dependencias para el controlador
import { ListToolsUseCase } from "../../domain/use-cases/mcp/list-tools.use-case";
import { CallToolUseCase } from "../../domain/use-cases/mcp/call-tool.use-case";
import { MCPRepositoryImpl } from "../../infrastructure/repositories/mcp/mcp.repository.impl";
import { MCPDataSourceImpl } from "../../infrastructure/datasources/mcp/mcp.datasource.impl";

// Importar repositorios necesarios para las herramientas MCP
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order/order.repository.impl";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { OrderMongoDataSourceImpl } from "../../infrastructure/datasources/order/order.mongo.datasource.impl";

export class MCPRoutes {
    static get getMCPRoutes(): Router {
        const router = Router();

        // Configurar datasources
        const productDataSource = new ProductMongoDataSourceImpl();
        const customerDataSource = new CustomerMongoDataSourceImpl();
        const orderDataSource = new OrderMongoDataSourceImpl();

        // Configurar repositorios
        const productRepository = new ProductRepositoryImpl(productDataSource);
        const customerRepository = new CustomerRepositoryImpl(customerDataSource);
        const orderRepository = new OrderRepositoryImpl(orderDataSource);

        // Configurar MCP datasource y repository
        const mcpDataSource = new MCPDataSourceImpl(
            productRepository,
            customerRepository,
            orderRepository
        );
        const mcpRepository = new MCPRepositoryImpl(mcpDataSource);

        // Configurar use cases
        const listToolsUseCase = new ListToolsUseCase(mcpRepository);
        const callToolUseCase = new CallToolUseCase(mcpRepository);

        // Inicializar el controlador MCP con dependencias
        const controller = new MCPController(listToolsUseCase, callToolUseCase);

        // Rutas para el servicio MCP
        router.get('/health', (req: Request, res: Response) => { controller.health(req, res) });
        router.get('/models', (req: Request, res: Response) => { controller.listModels(req, res) });

        // **RUTAS DE GUARDARRILES**
        router.get('/guardrails/config', (req: Request, res: Response) => { controller.getGuardrailsConfig(req, res) });
        router.get('/guardrails/stats', (req: Request, res: Response) => { controller.getGuardrailsStats(req, res) });
        router.post('/guardrails/sessions/:sessionId/reset', (req: Request, res: Response) => { controller.resetSession(req, res) });
        router.post('/guardrails/sessions/cleanup', (req: Request, res: Response) => { controller.cleanExpiredSessions(req, res) });
        router.post('/anthropic', (req: Request, res: Response) => { controller.anthropicProxy(req, res) });

        // Nuevas rutas para herramientas MCP
        router.get('/tools', (req: Request, res: Response) => { controller.listTools(req, res) });
        router.get('/tools/info', (req: Request, res: Response) => { controller.getToolsInfo(req, res) });
        router.post('/tools/call', (req: Request, res: Response) => { controller.callTool(req, res) });

        return router;
    }
}
