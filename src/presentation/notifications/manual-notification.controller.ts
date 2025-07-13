// src/presentation/notifications/manual-notification.controller.ts
import { Request, Response } from 'express';
import { ManualNotificationDto } from '../../domain/dtos/notifications/manual-notification.dto';
import { NotificationService } from '../../domain/interfaces/notification.interface';

export class ManualNotificationController {
    constructor(private notificationService: NotificationService) { }

    async sendManualNotification(req: Request, res: Response) {
        const [error, dto] = ManualNotificationDto.create(req.body);
        if (error) return res.status(400).json({ error });

        try {
            await this.notificationService.notify({
                title: dto.subject,
                body: dto.message,
                data: {
                    emailTo: dto.emailTo,
                    telegramChatId: dto.telegramChatId
                }
            });
            return res.status(200).json({ success: true, message: 'Notificación enviada' });
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Error enviando notificación' });
        }
    }
}
