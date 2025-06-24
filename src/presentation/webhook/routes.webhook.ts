import { Router } from 'express';
import { WebhookController } from './controller.webhook';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class WebhookRoutes {

  static get routes(): Router {
    const router = Router();
    const webhookController = new WebhookController();

    // Todas las rutas requieren autenticación de admin
    router.use(AuthMiddleware.validateJwt);
    router.use(AuthMiddleware.checkRole(['ADMIN_ROLE']));

    router.get('/', webhookController.getAllWebhooks);
    router.get('/stats', webhookController.getWebhookStats);
    router.get('/:id', webhookController.getWebhookById);

    return router;
  }
}
