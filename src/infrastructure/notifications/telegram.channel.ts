// src/infrastructure/notifications/telegram.channel.ts
import { NotificationChannel, NotificationMessage } from '../../domain/interfaces/notification.interface';
import { TelegramConfig } from '../../configs/notification.config';
import axios from 'axios';
import logger from '../../configs/logger';

export class TelegramChannel implements NotificationChannel {
    constructor(private config: TelegramConfig) {}

    async send(message: NotificationMessage): Promise<void> {
        if (!this.config.botToken || !this.config.chatId) {
            logger.warn('Telegram configuration is missing, skipping notification');
            return;
        }

        const telegramMessage = this.formatMessage(message);
        const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;

        try {
            await axios.post(url, {
                chat_id: this.config.chatId,
                text: telegramMessage,
                parse_mode: 'HTML'
            });
            
            logger.info('Telegram notification sent successfully');
        } catch (error) {
            logger.error('Error sending Telegram notification:', error);
            throw new Error('Failed to send Telegram notification');
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
