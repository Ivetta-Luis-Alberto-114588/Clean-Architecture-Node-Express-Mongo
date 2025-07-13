// src/infrastructure/notificationService.ts
import { NotificationService, NotificationMessage } from '../domain/interfaces/notification.interface';
import { TelegramChannel } from './notifications/telegram.channel';
import { EmailChannel } from './notifications/email.channel';
import { telegramService } from './telegramService';
import { notificationConfig } from '../configs/notification.config';

class NotificationServiceImpl implements NotificationService {
    private telegramChannel = new TelegramChannel(telegramService);
    private emailChannel = new EmailChannel(notificationConfig.email!);

    async notify(message: NotificationMessage): Promise<void> {
        const promises = [];
        if (message.data?.emailTo) {
            promises.push(this.emailChannel.send({
                title: message.title,
                body: message.body,
                data: message.data
            }));
        }
        if (message.data?.telegramChatId) {
            promises.push(this.telegramChannel.send({
                title: message.title,
                body: message.body,
                data: message.data
            }));
        }
        if (promises.length === 0) {
            // Si no se especifica canal, enviar a ambos por defecto
            promises.push(this.emailChannel.send({ title: message.title, body: message.body, data: message.data }));
            promises.push(this.telegramChannel.send({ title: message.title, body: message.body, data: message.data }));
        }
        await Promise.all(promises);
    }
}

export const notificationService = new NotificationServiceImpl();
