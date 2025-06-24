import { Router } from 'express';
import { WebhookController } from './controller.webhook';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { paymentService } from '../../configs/payment';
import { loggerService } from '../../configs/logger';

export class WebhookRoutes {

  static get routes(): Router {
    const router = Router();
    const webhookController = new WebhookController(paymentService, loggerService);

    // Todas las rutas requieren autenticación de admin
    router.use(AuthMiddleware.validateJwt);
    router.use(AuthMiddleware.checkRole(['ADMIN_ROLE']));

    router.get('/', webhookController.getAllWebhooks);
    router.get('/stats', webhookController.getWebhookStats);
    router.get('/:id', webhookController.getWebhookById);
    router.get('/:id/mercadopago-details', webhookController.getMercadoPagoDetails);

    return router;
  }
}
