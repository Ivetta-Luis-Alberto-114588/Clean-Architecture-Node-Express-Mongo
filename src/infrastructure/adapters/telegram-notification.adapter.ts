// src/infrastructure/adapters/telegram-notification.adapter.ts
import { NotificationService } from '../../domain/interfaces/services/notification.service';
import { envs } from '../../configs/envs';
import { ILogger } from '../../domain/interfaces/logger.interface';

export class TelegramNotificationAdapter implements NotificationService {
    private readonly telegramBotToken: string;
    private readonly telegramChatId: string;
    private readonly telegramApiUrl: string;

    constructor(private readonly logger: ILogger) {
        this.telegramBotToken = envs.TELEGRAM_BOT_TOKEN;
        this.telegramChatId = envs.TELEGRAM_CHAT_ID;
        this.telegramApiUrl = `https://api.telegram.org/bot${this.telegramBotToken}`;

        // Log detallado de configuración al instanciar
        this.logger.info(`🔧 [TelegramAdapter] Constructor ejecutado`, {
            botTokenPresent: !!this.telegramBotToken,
            botTokenLength: this.telegramBotToken ? this.telegramBotToken.length : 0,
            chatIdPresent: !!this.telegramChatId,
            chatId: this.telegramChatId,
            apiUrl: this.telegramApiUrl,
            timestamp: new Date().toISOString()
        });
    }

    async sendMessage(message: string, chatId?: string): Promise<void> {
        const targetChatId = chatId || this.telegramChatId;
        const timestamp = new Date().toISOString();
        // Registro genérico para integración: inicio de envío
        this.logger.info('Sending Telegram message', {
            chatId: targetChatId,
            messageLength: message.length
        });

        try {
            this.logger.info(`� [TelegramAdapter] === INICIO ENVÍO MENSAJE ===`, {
                timestamp,
                chatId: targetChatId,
                messageLength: message.length,
                botToken: this.telegramBotToken ? `${this.telegramBotToken.substring(0, 10)}...` : 'NO CONFIGURADO',
                apiUrl: this.telegramApiUrl,
                messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : '')
            });

            // Preparar el payload
            const payload = {
                chat_id: targetChatId,
                text: message,
                parse_mode: 'HTML',
            };

            this.logger.info(`📤 [TelegramAdapter] Payload preparado`, {
                payload: JSON.stringify(payload, null, 2),
                payloadSize: JSON.stringify(payload).length
            });

            // Realizar la petición
            this.logger.info(`🌐 [TelegramAdapter] Realizando petición HTTP a Telegram API`);

            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            };

            this.logger.info(`📋 [TelegramAdapter] Opciones de fetch`, {
                method: fetchOptions.method,
                headers: fetchOptions.headers,
                bodyLength: fetchOptions.body.length
            });

            const response = await fetch(`${this.telegramApiUrl}/sendMessage`, fetchOptions);

            this.logger.info(`📡 [TelegramAdapter] Respuesta recibida de Telegram API`, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                contentType: response.headers?.get?.('content-type'),
                url: response.url
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    errorData = await response.text();
                }

                // Log de error en API con detalles y metadatos esperados por tests
                this.logger.error(`❌ [TelegramAdapter] Telegram API error - RESPUESTA DETALLADA:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData,
                    requestPayload: payload,
                    chatId: targetChatId,
                    messageLength: message.length,
                    apiUrl: this.telegramApiUrl,
                    timestamp: new Date().toISOString()
                });
                // Construir mensaje de error legible y consistente
                const errorMsg = typeof errorData === 'object'
                    ? (errorData.description ?? 'Unknown error')
                    : String(errorData);
                throw new Error(`Telegram API error: ${errorMsg}`);
            }

            const responseData = await response.json();
            this.logger.info(`✅ [TelegramAdapter] === MENSAJE ENVIADO EXITOSAMENTE ===`, {
                chatId: targetChatId,
                messageId: responseData.result?.message_id,
                responseData: responseData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error(`💥 [TelegramAdapter] === ERROR CRÍTICO EN ENVÍO ===`, {
                error: error instanceof Error ? error.message : String(error),
                errorType: error.constructor.name,
                chatId: targetChatId,
                messageLength: message.length,
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                botToken: this.telegramBotToken ? 'PRESENTE' : 'AUSENTE',
                apiUrl: this.telegramApiUrl
            });
            throw error;
        }
    }

    async sendMessageToAdmin(message: string): Promise<void> {
        this.logger.info(`👤 [TelegramAdapter] === INICIO sendMessageToAdmin ===`, {
            adminChatId: this.telegramChatId,
            messageLength: message.length,
            timestamp: new Date().toISOString()
        });

        try {
            await this.sendMessage(message, this.telegramChatId);
            this.logger.info(`✅ [TelegramAdapter] === sendMessageToAdmin COMPLETADO ===`);
        } catch (error) {
            this.logger.error(`💥 [TelegramAdapter] === ERROR EN sendMessageToAdmin ===`, {
                error: error instanceof Error ? error.message : String(error),
                adminChatId: this.telegramChatId,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    } async sendOrderNotification(orderData: {
        orderId: string;
        customerName: string;
        total: number;
        items: Array<{ name: string; quantity: number; price: number }>;
    }): Promise<void> {
        const timestamp = new Date().toISOString();

        this.logger.info(`🎯 [TelegramAdapter] === INICIO sendOrderNotification ===`, {
            timestamp,
            orderId: orderData.orderId,
            customerName: orderData.customerName,
            total: orderData.total,
            itemsCount: orderData.items.length,
            orderData: JSON.stringify(orderData, null, 2)
        });

        try {
            // Preparar la lista de items
            this.logger.info(`📋 [TelegramAdapter] Preparando lista de items`);
            const itemsList = orderData.items
                .map(item => `• ${item.name} x${item.quantity} - $${item.price.toFixed(2)}`)
                .join('\n');

            this.logger.info(`📝 [TelegramAdapter] Items formateados`, {
                itemsList,
                itemsListLength: itemsList.length
            });

            // Preparar el mensaje
            const message = `
🛒 <b>Nueva Orden Recibida</b>

📋 <b>ID:</b> ${orderData.orderId}
👤 <b>Cliente:</b> ${orderData.customerName}
💰 <b>Total:</b> $${orderData.total.toFixed(2)}

📦 <b>Items:</b>
${itemsList}

⏰ <b>Fecha:</b> ${new Date().toLocaleString('es-AR')}
        `.trim();

            this.logger.info(`� [TelegramAdapter] Mensaje preparado para envío`, {
                messageLength: message.length,
                messagePreview: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
                fullMessage: message
            });

            this.logger.info(`📤 [TelegramAdapter] Llamando a sendMessageToAdmin`);
            await this.sendMessageToAdmin(message);

            this.logger.info(`🎉 [TelegramAdapter] === ORDEN NOTIFICATION COMPLETADA EXITOSAMENTE ===`, {
                orderId: orderData.orderId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            this.logger.error(`💥 [TelegramAdapter] === ERROR EN sendOrderNotification ===`, {
                orderId: orderData.orderId,
                error: error instanceof Error ? error.message : String(error),
                errorType: error.constructor.name,
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                orderData: JSON.stringify(orderData, null, 2)
            });
            throw error; // Re-lanzar el error para que sea capturado por el webhook
        }
    }

    async sendPaymentNotification(paymentData: {
        orderId: string;
        amount: number;
        paymentMethod: string;
        status: string;
    }): Promise<void> {
        const statusEmoji = paymentData.status === 'approved' ? '✅' :
            paymentData.status === 'pending' ? '⏳' : '❌';

        const message = `
💳 <b>Notificación de Pago</b>

${statusEmoji} <b>Estado:</b> ${paymentData.status.toUpperCase()}
📋 <b>Orden:</b> ${paymentData.orderId}
💰 <b>Monto:</b> $${paymentData.amount.toFixed(2)}
🏦 <b>Método:</b> ${paymentData.paymentMethod}

⏰ <b>Fecha:</b> ${new Date().toLocaleString('es-AR')}
    `.trim();

        await this.sendMessageToAdmin(message);
    }
}

// Crear y exportar la instancia singleton
import { loggerService } from '../../configs/logger';
export const telegramNotificationService = new TelegramNotificationAdapter(loggerService);
