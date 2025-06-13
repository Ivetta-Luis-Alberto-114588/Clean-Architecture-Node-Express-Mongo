// src/infrastructure/notifications/telegram.channel.ts
import { NotificationChannel, NotificationMessage } from '../../domain/interfaces/notification.interface';
import { ITelegramService } from '../../domain/interfaces/telegram.service';

export class TelegramChannel implements NotificationChannel {
    constructor(private telegramService: ITelegramService) {}    async send(message: NotificationMessage): Promise<void> {
        if (!this.telegramService.isConfigured()) {
            return;
        }

        const telegramMessage = this.formatMessage(message);
        
        const result = await this.telegramService.sendMessageToDefaultChat(telegramMessage, 'HTML');
        
        if (!result.success) {
            throw new Error(`Failed to send Telegram notification: ${result.error}`);
        }
    }

    private formatMessage(message: NotificationMessage): string {
        let formattedMessage = `<b>${message.title}</b>\n\n${message.body}`;
        
        if (message.data) {
            formattedMessage += '\n\n<b>Detalles:</b>';
            Object.entries(message.data).forEach(([key, value]) => {
                formattedMessage += `\n• ${key}: ${value}`;
            });
        }

        return formattedMessage;
    }
}
