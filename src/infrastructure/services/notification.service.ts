// src/infrastructure/services/notification.service.ts
import { NotificationService as BaseNotificationService, NotificationMessage, NotificationChannel } from '../../domain/interfaces/notification.interface';
import { NotificationService as ServiceNotificationService } from '../../domain/interfaces/services/notification.service';
import { NotificationConfig } from '../../configs/notification.config';
import { TelegramChannel } from '../notifications/telegram.channel';
import { EmailChannel } from '../notifications/email.channel';
import { TelegramAdapter } from '../adapters/telegram.adapter';
import { WinstonLoggerAdapter } from '../adapters/winston-logger.adapter';
import { ILogger } from '../../domain/interfaces/logger.interface';

export class NotificationServiceImpl implements BaseNotificationService, ServiceNotificationService {
    private channels: NotificationChannel[] = [];
    private logger: ILogger;

    constructor(private config: NotificationConfig) {
        this.logger = new WinstonLoggerAdapter();
        this.initializeChannels();
    }

    private initializeChannels(): void {
        this.logger.info(`🔍 [NotificationService] Inicializando canales. ActiveChannels: ${this.config.activeChannels.join(', ')}`);
        
        this.config.activeChannels.forEach(channelType => {
            this.logger.info(`🔧 [NotificationService] Configurando canal: ${channelType}`);
            
            switch (channelType) {
                case 'telegram':
                    if (this.config.telegram) {
                        this.logger.info(`✅ [NotificationService] Configuración de Telegram encontrada`, {
                            botToken: this.config.telegram.botToken ? 'CONFIGURADO' : 'NO CONFIGURADO',
                            chatId: this.config.telegram.chatId || 'NO CONFIGURADO'
                        });
                        
                        const telegramAdapter = new TelegramAdapter(
                            {
                                botToken: this.config.telegram.botToken,
                                defaultChatId: this.config.telegram.chatId
                            },
                            this.logger
                        );
                        this.channels.push(new TelegramChannel(telegramAdapter));
                        this.logger.info('✅ [NotificationService] Telegram notification channel initialized');
                    } else {
                        this.logger.warn('⚠️ [NotificationService] Canal telegram solicitado pero configuración no encontrada');
                    }
                    break; case 'email':
                    if (this.config.email) {
                        this.channels.push(new EmailChannel(this.config.email));
                        this.logger.info('Email notification channel initialized');
                    }
                    break;
            }
        });

        this.logger.info(`Notification service initialized with ${this.channels.length} channels`);
    }

    async notify(message: NotificationMessage): Promise<void> {
        this.logger.info(`🔍 [NotificationService] notify() llamado`, {
            title: message.title,
            channelsCount: this.channels.length,
            channelTypes: this.channels.map(ch => ch.constructor.name)
        });
        
        if (this.channels.length === 0) {
            this.logger.warn('❌ [NotificationService] No notification channels configured, skipping notification');
            return;
        }

        const promises = this.channels.map(async (channel, index) => {
            try {
                this.logger.info(`📤 [NotificationService] Enviando mensaje por canal ${index} (${channel.constructor.name})`);
                await channel.send(message);
                this.logger.info(`✅ [NotificationService] Mensaje enviado exitosamente por canal ${index} (${channel.constructor.name})`);
            } catch (error) {
                this.logger.error(`❌ [NotificationService] Error en canal ${index} (${channel.constructor.name}):`, {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    channelType: channel.constructor.name
                });
                // No lanzamos el error para que otros canales puedan funcionar
                throw error; // Re-lanzar para que se propague al Promise.allSettled
            }
        });

        await Promise.allSettled(promises);
        this.logger.info('Notification sent to all configured channels');
    }

    async sendMessage(message: string, chatId?: string): Promise<void> {
        const notification: NotificationMessage = {
            title: 'Mensaje',
            body: message,
            data: { chatId }
        };
        await this.notify(notification);
    }

    async sendMessageToAdmin(message: string): Promise<void> {
        const notification: NotificationMessage = {
            title: 'Mensaje para Administrador',
            body: message,
            data: { isAdminMessage: true }
        };
        await this.notify(notification);
    }

    async sendPaymentNotification(paymentData: {
        orderId: string;
        amount: number;
        paymentMethod: string;
        status: string;
    }): Promise<void> {
        const notification: NotificationMessage = {
            title: '💳 Notificación de Pago',
            body: `Pago ${paymentData.status} para orden ${paymentData.orderId}`,
            data: {
                'Orden ID': paymentData.orderId,
                'Monto': `$${paymentData.amount}`,
                'Método de Pago': paymentData.paymentMethod,
                'Estado': paymentData.status
            }
        };
        await this.notify(notification);
    }

    async sendOrderNotification(orderData: {
        orderId: string;
        customerName: string;
        total: number;
        items: Array<{ name: string; quantity: number; price: number; }>;
    }): Promise<void>;
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
        orderDate: Date;
    }): Promise<void>;
    async sendOrderNotification(orderData: any): Promise<void> {
        // Normalizar los datos para que funcione con ambas interfaces
        const normalizedItems = orderData.items.map((item: any) => ({
            productName: item.productName || item.name,
            quantity: item.quantity,
            price: item.price
        }));

        const itemsList = normalizedItems
            .map((item: any) => `${item.productName} (x${item.quantity}) - $${item.price}`)
            .join('\n');

        const message: NotificationMessage = {
            title: '🛒 Nueva Orden Recibida',
            body: `Se ha recibido una nueva orden del cliente ${orderData.customerName}.`,
            data: {
                'ID de Orden': orderData.orderId,
                'Cliente': orderData.customerName,
                'Email': orderData.customerEmail || 'No proporcionado',
                'Total': `$${orderData.total}`,
                'Fecha': orderData.orderDate ? orderData.orderDate.toLocaleString('es-ES') : new Date().toLocaleString('es-ES'),
                'Productos': itemsList
            }
        };

        await this.notify(message);
    }
}
