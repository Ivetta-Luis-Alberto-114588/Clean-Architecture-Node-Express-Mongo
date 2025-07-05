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
    }

    async sendMessage(message: string, chatId?: string): Promise<void> {
        const targetChatId = chatId || this.telegramChatId;

        try {
            this.logger.info(`🔍 [TelegramAdapter] Iniciando envío de mensaje`, {
                chatId: targetChatId,
                messageLength: message.length,
                botToken: this.telegramBotToken ? 'CONFIGURADO' : 'NO CONFIGURADO'
            });

            const response = await fetch(`${this.telegramApiUrl}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    text: message,
                    parse_mode: 'HTML',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                this.logger.error(`❌ [TelegramAdapter] Telegram API error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
                throw new Error(`Telegram API error: ${errorData.description || 'Unknown error'}`);
            }

            const responseData = await response.json();
            this.logger.info(`✅ [TelegramAdapter] Telegram message sent successfully`, { 
                chatId: targetChatId,
                messageId: responseData.result?.message_id
            });
        } catch (error) {
            this.logger.error(`❌ [TelegramAdapter] Failed to send Telegram message`, { 
                error: error instanceof Error ? error.message : String(error),
                chatId: targetChatId, 
                messageLength: message.length,
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    async sendMessageToAdmin(message: string): Promise<void> {
        await this.sendMessage(message, this.telegramChatId);
    }    async sendOrderNotification(orderData: {
        orderId: string;
        customerName: string;
        total: number;
        items: Array<{ name: string; quantity: number; price: number }>;
    }): Promise<void> {
        this.logger.info(`🔍 [TelegramAdapter] sendOrderNotification llamado para orden ${orderData.orderId}`);
        
        try {
            const itemsList = orderData.items
                .map(item => `• ${item.name} x${item.quantity} - $${item.price.toFixed(2)}`)
                .join('\n');

            const message = `
🛒 <b>Nueva Orden Recibida</b>

📋 <b>ID:</b> ${orderData.orderId}
👤 <b>Cliente:</b> ${orderData.customerName}
💰 <b>Total:</b> $${orderData.total.toFixed(2)}

📦 <b>Items:</b>
${itemsList}

⏰ <b>Fecha:</b> ${new Date().toLocaleString('es-AR')}
        `.trim();

            this.logger.info(`📤 [TelegramAdapter] Enviando mensaje a admin chat`);
            await this.sendMessageToAdmin(message);
            this.logger.info(`✅ [TelegramAdapter] Mensaje enviado exitosamente para orden ${orderData.orderId}`);
            
        } catch (error) {
            this.logger.error(`❌ [TelegramAdapter] Error en sendOrderNotification para orden ${orderData.orderId}:`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
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
