import { Router } from 'express';
import { MonitoringController } from './controller.monitoring';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class MonitoringRoutes {
    static get routes(): Router {
        const router = Router();
        const controller = new MonitoringController();

        // Ruta pública para health check básico
        router.get('/health', controller.getHealthCheck);

        // Proteger todas las demás rutas de monitoreo - solo admin
        router.use(AuthMiddleware.validateJwt);
        router.use(AuthMiddleware.checkRole(['ADMIN_ROLE', 'SUPER_ADMIN_ROLE']));

        // Rutas de monitoreo detallado
        router.get('/mongodb', controller.getMongoDBUsage);
        router.get('/render', controller.getRenderUsage);
        router.get('/complete', controller.getCompleteUsageReport);
        router.get('/alerts', controller.getAlerts);

        return router;
    }
}
