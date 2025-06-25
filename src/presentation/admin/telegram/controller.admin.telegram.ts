// src/presentation/admin/telegram/controller.admin.telegram.ts
import { Request, Response } from 'express';
import { TelegramNotificationAdapter } from '../../../infrastructure/adapters/telegram-notification.adapter';
import { loggerService } from '../../../configs/logger';
import { CustomError } from '../../../domain/errors/custom.error';

export class TelegramAdminController {
    constructor(
        private readonly telegramService: TelegramNotificationAdapter
    ) { }

    /**
     * Enviar notificación personalizada de Telegram
     */
    sendNotification = async (req: Request, res: Response) => {
        try {
            const { message, chatId, parseMode, disablePreview } = req.body;

            // Validación del mensaje
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                return res.status(400).json({
                    error: 'Message is required and must be a non-empty string'
                });
            }

            // Limitar el tamaño del mensaje (Telegram tiene límite de 4096 caracteres)
            if (message.length > 4096) {
                return res.status(400).json({
                    error: 'Message is too long. Maximum 4096 characters allowed.'
                });
            }

            loggerService.info('Admin sending Telegram notification', {
                messageLength: message.length,
                chatId: chatId || 'default',
                adminUser: req.body.user?.email || 'unknown'
            });

            // Enviar el mensaje usando el servicio de Telegram
            await this.telegramService.sendMessage(message, chatId);

            return res.status(200).json({
                success: true,
                message: 'Notification sent successfully',
                timestamp: new Date().toISOString(),
                sentTo: chatId || 'default chat'
            });

        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * Obtener información del bot de Telegram
     */
    getBotInfo = async (req: Request, res: Response) => {
        try {
            const botInfo = {
                botName: process.env.Telegram_name || 'StartUp_test_luis_bot',
                status: 'active',
                defaultChatId: process.env.TELEGRAM_CHAT_ID,
                apiConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
            };

            loggerService.info('Admin requested bot info', {
                adminUser: req.body.user?.email || 'unknown'
            });

            return res.status(200).json({
                success: true,
                data: botInfo
            });

        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * Enviar mensaje de prueba
     */
    sendTestMessage = async (req: Request, res: Response) => {
        try {
            const customMessage = req.body.message;
            const testMessage = customMessage ||
                `🧪 <b>Mensaje de prueba</b>\n\n` +
                `✅ El sistema de notificaciones de Telegram está funcionando correctamente.\n` +
                `⏰ Enviado el: ${new Date().toLocaleString('es-AR')}\n` +
                `👤 Por: Panel de Administración`;

            loggerService.info('Admin sending test Telegram message', {
                adminUser: req.body.user?.email || 'unknown',
                hasCustomMessage: !!customMessage
            });

            await this.telegramService.sendMessageToAdmin(testMessage);

            return res.status(200).json({
                success: true,
                message: 'Test message sent successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * Enviar notificación de orden (manual)
     */
    sendOrderNotification = async (req: Request, res: Response) => {
        try {
            const { orderId, customerName, total, items } = req.body;

            // Validaciones
            if (!orderId || !customerName || !total || !items) {
                return res.status(400).json({
                    error: 'orderId, customerName, total, and items are required'
                });
            }

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    error: 'items must be a non-empty array'
                });
            }

            loggerService.info('Admin sending manual order notification', {
                orderId,
                customerName,
                adminUser: req.body.user?.email || 'unknown'
            });

            await this.telegramService.sendOrderNotification({
                orderId,
                customerName,
                total: parseFloat(total),
                items
            });

            return res.status(200).json({
                success: true,
                message: 'Order notification sent successfully',
                orderId
            });

        } catch (error) {
            return this.handleError(error, res);
        }
    };

    /**
     * Manejo centralizado de errores
     */
    private handleError = (error: unknown, res: Response) => {
        loggerService.error('Error in TelegramAdminController:', error);

        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({
                error: error.message
            });
        }

        // Error de Telegram API
        if (error instanceof Error && error.message.includes('Telegram API error')) {
            return res.status(400).json({
                error: 'Failed to send Telegram notification: ' + error.message
            });
        }

        // Error genérico
        return res.status(500).json({
            error: 'Internal server error while processing Telegram notification'
        });
    };
}
