// src/presentation/mcp/routes.mcp.ts
import { Router, Request, Response } from "express";
import { MCPController } from "./controller.mcp";

export class MCPRoutes {
    static get getMCPRoutes(): Router {
        const router = Router();

        // Inicializar el controlador MCP
        const controller = new MCPController();

        // Rutas para el servicio MCP
        router.get('/health', (req: Request, res: Response) => { controller.health(req, res) });
        router.post('/anthropic', (req: Request, res: Response) => { controller.anthropicProxy(req, res) });

        return router;
    }
}
