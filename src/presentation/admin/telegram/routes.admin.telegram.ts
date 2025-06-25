// src/presentation/admin/telegram/routes.admin.telegram.ts
import { Router } from 'express';
import { TelegramAdminController } from './controller.admin.telegram';
import { telegramNotificationService } from '../../../infrastructure/adapters/telegram-notification.adapter';

export class AdminTelegramRoutes {
    
    static getRoutes(): Router {
        const router = Router();
        
        // Crear instancia del controller con la dependencia del servicio
        const controller = new TelegramAdminController(telegramNotificationService);

        // Rutas de administración de Telegram
        // NOTA: Los middlewares de autenticación y verificación de rol admin 
        // ya están aplicados en el router padre (AdminRoutes)

        /**
         * POST /api/admin/telegram/send-notification
         * Enviar notificación personalizada de Telegram
         * Body: { message: string, chatId?: string, parseMode?: string, disablePreview?: boolean }
         */
        router.post('/send-notification', controller.sendNotification.bind(controller));

        /**
         * GET /api/admin/telegram/bot-info
         * Obtener información del bot de Telegram
         */
        router.get('/bot-info', controller.getBotInfo.bind(controller));

        /**
         * POST /api/admin/telegram/send-test
         * Enviar mensaje de prueba
         * Body: { message?: string }
         */
        router.post('/send-test', controller.sendTestMessage.bind(controller));

        /**
         * POST /api/admin/telegram/send-order-notification
         * Enviar notificación de orden manualmente
         * Body: { orderId: string, customerName: string, total: number, items: Array<{name, quantity, price}> }
         */
        router.post('/send-order-notification', controller.sendOrderNotification.bind(controller));

        return router;
    }
}
