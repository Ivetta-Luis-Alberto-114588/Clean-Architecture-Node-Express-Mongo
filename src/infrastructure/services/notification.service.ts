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
        const timestamp = new Date().toISOString();

        this.logger.info(`🎯 [NotificationService] === INICIO NOTIFY ===`, {
            timestamp,
            title: message.title,
            body: message.body ? message.body.substring(0, 100) + (message.body.length > 100 ? '...' : '') : 'NO BODY',
            channelsCount: this.channels.length,
            channelTypes: this.channels.map(ch => ch.constructor.name),
            messageData: message.data
        });

        if (this.channels.length === 0) {
            this.logger.warn('❌ [NotificationService] No notification channels configured, skipping notification');
            return;
        }

        const promises = this.channels.map(async (channel, index) => {
            const channelStartTime = Date.now();
            try {
                this.logger.info(`📤 [NotificationService] === INICIANDO CANAL ${index} ===`, {
                    channelName: channel.constructor.name,
                    channelIndex: index,
                    timestamp: new Date().toISOString()
                });

                await channel.send(message);

                const channelDuration = Date.now() - channelStartTime;
                this.logger.info(`✅ [NotificationService] === CANAL ${index} COMPLETADO ===`, {
                    channelName: channel.constructor.name,
                    channelIndex: index,
                    duration: `${channelDuration}ms`,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                const channelDuration = Date.now() - channelStartTime;
                this.logger.error(`💥 [NotificationService] === ERROR EN CANAL ${index} ===`, {
                    error: error instanceof Error ? error.message : String(error),
                    errorType: error.constructor.name,
                    stack: error instanceof Error ? error.stack : undefined,
                    channelType: channel.constructor.name,
                    channelIndex: index,
                    duration: `${channelDuration}ms`,
                    timestamp: new Date().toISOString()
                });
                // No lanzamos el error para que otros canales puedan funcionar
                throw error; // Re-lanzar para que se propague al Promise.allSettled
            }
        });

        this.logger.info(`⏳ [NotificationService] Esperando resolución de ${promises.length} canales`);
        const results = await Promise.allSettled(promises);

        // Analizar resultados
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        this.logger.info(`📊 [NotificationService] === RESUMEN FINAL ===`, {
            totalChannels: results.length,
            successful,
            failed,
            timestamp: new Date().toISOString()
        });

        // Log de errores específicos
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                this.logger.error(`💥 [NotificationService] Canal ${index} falló:`, {
                    channelType: this.channels[index].constructor.name,
                    error: result.reason
                });
            }
        });

        this.logger.info('🏁 [NotificationService] === NOTIFY COMPLETADO ===');
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
