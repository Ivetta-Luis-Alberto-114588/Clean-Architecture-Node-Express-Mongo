import { Router } from 'express';
import { IntelligentController } from './intelligent.controller';

/**
 * 🧠 Rutas del Sistema Inteligente con LangChain + Claude  
 * Alternativa conversacional y natural al MCP rígido
 */
export class IntelligentRoutes {
    static get routes(): Router {
        const router = Router();
        const controller = new IntelligentController();

        // 💬 Chat principal - consulta natural simple
        router.post('/chat', (req, res) => {
            controller.chat(req, res);
        });

        // 🔄 Compatible con formato Anthropic MCP
        router.post('/anthropic', (req, res) => {
            controller.anthropicCompatible(req, res);
        });

        // 📊 Información del sistema
        router.get('/info', (req, res) => {
            controller.info(req, res);
        });

        // ❤️ Health check
        router.get('/health', (req, res) => {
            controller.health(req, res);
        });

        console.log('[Intelligent] Routes configured');
        return router;
    }
}
