// src/presentation/mcp/routes.simple.ts
import { Router, Request, Response } from "express";
import { SimpleMCPController } from "./controller.simple";

export class SimpleMCPRoutes {
    static get getSimpleMCPRoutes(): Router {
        const router = Router();
        const controller = new SimpleMCPController();

        // Rutas MCP simplificadas
        router.get('/health', (req: Request, res: Response) => { controller.health(req, res); });
        router.get('/tools', (req: Request, res: Response) => { controller.listTools(req, res); });
        router.get('/tools/:toolName', (req: Request, res: Response) => { controller.getToolDocumentation(req, res); });
        router.post('/tools/call', (req: Request, res: Response) => { controller.callTool(req, res); });

        return router;
    }
}
