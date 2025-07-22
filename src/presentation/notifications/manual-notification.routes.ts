// src/presentation/notifications/manual-notification.routes.ts
import { Router } from 'express';
import { ManualNotificationController } from './manual-notification.controller';
import { telegramNotificationService } from '../../infrastructure/adapters/telegram-notification.adapter';
import { NodemailerAdapter } from '../../infrastructure/adapters/nodemailer.adapter';

const router = Router();

// Crear instancia del servicio de email
const emailService = new NodemailerAdapter();

// Crear controller con ambos servicios
const controller = new ManualNotificationController(telegramNotificationService, emailService);

// Ruta pública para invitados - sin autenticación
router.post('/manual', (req, res, next) => {
    controller.sendManualNotification(req, res).catch(next);
});

export default router;
