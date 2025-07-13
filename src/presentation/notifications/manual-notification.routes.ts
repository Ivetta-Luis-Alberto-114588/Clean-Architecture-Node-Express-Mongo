// src/presentation/notifications/manual-notification.routes.ts
import { Router } from 'express';
import { ManualNotificationController } from './manual-notification.controller';
import { notificationService } from '../../infrastructure/notificationService'; // Debe existir o crearse un singleton/factory

const router = Router();
const controller = new ManualNotificationController(notificationService);

router.post('/manual', (req, res, next) => {
    controller.sendManualNotification(req, res).catch(next);
});

export default router;
