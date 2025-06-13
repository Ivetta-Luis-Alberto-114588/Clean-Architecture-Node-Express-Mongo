// src/infrastructure/services/notification.service.ts
import { NotificationService, NotificationMessage, NotificationChannel } from '../../domain/interfaces/notification.interface';
import { NotificationConfig } from '../../configs/notification.config';
import { TelegramChannel } from '../notifications/telegram.channel';
import { EmailChannel } from '../notifications/email.channel';
import { TelegramAdapter } from '../adapters/telegram.adapter';
import { WinstonLoggerAdapter } from '../adapters/winston-logger.adapter';
import { ILogger } from '../../domain/interfaces/logger.interface';

export class NotificationServiceImpl implements NotificationService {
    private channels: NotificationChannel[] = [];
    private logger: ILogger;

    constructor(private config: NotificationConfig) {
        this.logger = new WinstonLoggerAdapter();
        this.initializeChannels();
    }

    private initializeChannels(): void {
        this.config.activeChannels.forEach(channelType => {
            switch (channelType) {                case 'telegram':
                    if (this.config.telegram) {
                        const telegramAdapter = new TelegramAdapter(
                            {
                                botToken: this.config.telegram.botToken,
                                defaultChatId: this.config.telegram.chatId
                            },
                            this.logger
                        );
                        this.channels.push(new TelegramChannel(telegramAdapter));
                        this.logger.info('Telegram notification channel initialized');
                    }
                    break;                case 'email':
                    if (this.config.email) {
                        this.channels.push(new EmailChannel(this.config.email));
                        this.logger.info('Email notification channel initialized');
                    }
                    break;
            }        });

        this.logger.info(`Notification service initialized with ${this.channels.length} channels`);
    }

    async notify(message: NotificationMessage): Promise<void> {
        if (this.channels.length === 0) {
            this.logger.warn('No notification channels configured, skipping notification');
            return;
        }

        const promises = this.channels.map(channel => 
            channel.send(message).catch(error => {
                this.logger.error('Notification channel error:', error);
                // No lanzamos el error para que otros canales puedan funcionar
            })
        );

        await Promise.allSettled(promises);
        this.logger.info('Notification sent to all configured channels');
    }

    async sendOrderNotification(orderData: {
        orderId: string;
        customerName: string;
        customerEmail: string;
        total: number;
        items: Array<{
            productName: string;
            quantity: number;
            price: number;
        }>;
        orderDate: Date;    }): Promise<void> {
        const itemsList = orderData.items
            .map(item => `${item.productName} (x${item.quantity}) - $${item.price}`)
            .join('\n');

        const message: NotificationMessage = {
            title: '🛒 Nueva Orden Recibida',
            body: `Se ha recibido una nueva orden del cliente ${orderData.customerName}.`,
            data: {
                'ID de Orden': orderData.orderId,
                'Cliente': orderData.customerName,
                'Email': orderData.customerEmail,
                'Total': `$${orderData.total}`,
                'Fecha': orderData.orderDate.toLocaleString('es-ES'),
                'Productos': itemsList
            }
        };

        await this.notify(message);
    }
}
