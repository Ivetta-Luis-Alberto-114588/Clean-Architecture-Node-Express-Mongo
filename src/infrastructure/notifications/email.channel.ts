// src/infrastructure/notifications/email.channel.ts
import { NotificationChannel, NotificationMessage } from '../../domain/interfaces/notification.interface';
import { EmailConfig } from '../../configs/notification.config';
import nodemailer from 'nodemailer';
import logger from '../../configs/logger';

export class EmailChannel implements NotificationChannel {
    private transporter: nodemailer.Transporter; constructor(private config: EmailConfig) {
        this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port,
            secure: this.config.port === 465,
            auth: {
                user: this.config.user,
                pass: this.config.password
            }
        });
    }

    async send(message: NotificationMessage): Promise<void> {
        const timestamp = new Date().toISOString();

        logger.info(`📧 [EmailChannel] === INICIO ENVÍO EMAIL ===`, {
            timestamp,
            title: message.title,
            bodyLength: message.body ? message.body.length : 0,
            hasData: !!message.data,
            dataKeys: message.data ? Object.keys(message.data) : [],
            to: this.config.to,
            from: this.config.from
        });

        if (!this.config.to) {
            logger.warn('Email recipient is missing, skipping notification');
            return;
        }

        const htmlContent = this.formatMessage(message);

        logger.info(`📝 [EmailChannel] HTML content preparado`, {
            htmlLength: htmlContent.length,
            htmlPreview: htmlContent.substring(0, 200) + (htmlContent.length > 200 ? '...' : '')
        });

        try {
            const mailOptions = {
                from: this.config.from,
                to: this.config.to,
                subject: message.title,
                html: htmlContent
            };

            logger.info(`📤 [EmailChannel] Enviando email con transporter`, {
                mailOptions: {
                    ...mailOptions,
                    html: htmlContent.substring(0, 100) + '...'
                }
            });

            const emailStartTime = Date.now();
            const result = await this.transporter.sendMail(mailOptions);
            const emailDuration = Date.now() - emailStartTime;

            logger.info(`✅ [EmailChannel] === EMAIL ENVIADO EXITOSAMENTE ===`, {
                messageId: result.messageId,
                response: result.response,
                accepted: result.accepted,
                rejected: result.rejected,
                duration: `${emailDuration}ms`,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error(`💥 [EmailChannel] === ERROR CRÍTICO EN EMAIL ===`, {
                error: error instanceof Error ? error.message : String(error),
                errorType: error.constructor.name,
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
            throw new Error('Failed to send email notification');
        }
    }

    private formatMessage(message: NotificationMessage): string {
        let html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                    ${message.title}
                </h2>
                <p style="font-size: 16px; line-height: 1.5; color: #555;">
                    ${message.body}
                </p>
        `;

        if (message.data) {
            html += `
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
                    <h3 style="color: #333; margin-top: 0;">Detalles:</h3>
                    <ul style="list-style: none; padding-left: 0;">
            `;
            Object.entries(message.data).forEach(([key, value]) => {
                html += `
                    <li style="margin-bottom: 8px;">
                        <strong>${key}:</strong> ${value}
                    </li>
                `;
            });
            html += '</ul></div>';
        }

        html += '</div>';
        return html;
    }
}
