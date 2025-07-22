// src/presentation/notifications/manual-notification.controller.ts
import { Request, Response } from 'express';
import { ManualNotificationDto } from '../../domain/dtos/notifications/manual-notification.dto';
import { TelegramNotificationAdapter } from '../../infrastructure/adapters/telegram-notification.adapter';
import { NodemailerAdapter } from '../../infrastructure/adapters/nodemailer.adapter';
import { loggerService } from '../../configs/logger';
import { CustomError } from '../../domain/errors/custom.error';

export class ManualNotificationController {
    constructor(
        private telegramService: TelegramNotificationAdapter,
        private emailService: NodemailerAdapter
    ) { }

    async sendManualNotification(req: Request, res: Response) {
        try {
            const [error, dto] = ManualNotificationDto.create(req.body);
            if (error) return res.status(400).json({ error });

            loggerService.info('Manual notification request received', {
                subject: dto!.subject,
                messageLength: dto!.message.length,
                emailTo: dto!.emailTo,
                telegramChatId: dto!.telegramChatId,
                timestamp: new Date().toISOString()
            });

            const promises: Promise<any>[] = [];

            // Enviar por Telegram si se especifica o por defecto
            if (dto!.telegramChatId || !dto!.emailTo) {
                loggerService.info('Sending Telegram notification via real service');
                promises.push(
                    this.telegramService.sendMessage(
                        `<b>${dto!.subject}</b>\n\n${dto!.message}`,
                        dto!.telegramChatId
                    )
                );
            }

            // Enviar por email si se especifica
            if (dto!.emailTo) {
                loggerService.info('Sending email notification', { emailTo: dto!.emailTo });
                promises.push(
                    this.emailService.sendEmail({
                        to: dto!.emailTo,
                        subject: dto!.subject,
                        htmlBody: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                                    ${dto!.subject}
                                </h2>
                                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                                    <p style="color: #333; line-height: 1.6; margin: 0;">
                                        ${dto!.message.replace(/\n/g, '<br>')}
                                    </p>
                                </div>
                                <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
                                <p style="color: #6c757d; font-size: 12px; text-align: center;">
                                    Notificación enviada el ${new Date().toLocaleString('es-AR')}
                                </p>
                            </div>
                        `,
                        attachments: []
                    })
                );
            }

            // Si no se especifica ningún canal, enviar por ambos por defecto
            if (!dto!.emailTo && !dto!.telegramChatId) {
                loggerService.info('No specific channel specified, sending to default channels');
                // Ya se agregó Telegram arriba, aquí podríamos agregar email por defecto si fuera necesario
            }

            // Ejecutar todas las promesas
            await Promise.all(promises);

            loggerService.info('Manual notification sent successfully');
            return res.status(200).json({
                success: true,
                message: 'Notificación enviada',
                timestamp: new Date().toISOString(),
                sentTo: {
                    telegram: dto!.telegramChatId || (!dto!.emailTo ? 'default' : false),
                    email: dto!.emailTo || false
                }
            });
        } catch (err: any) {
            return this.handleError(err, res);
        }
    }

    /**
     * Manejo centralizado de errores
     */
    private handleError = (error: unknown, res: Response) => {
        loggerService.error('Error in ManualNotificationController:', error);

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
            error: 'Internal server error while processing notification'
        });
    };
}
