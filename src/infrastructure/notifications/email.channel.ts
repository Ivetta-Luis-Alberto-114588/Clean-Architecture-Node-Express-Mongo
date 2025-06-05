// src/infrastructure/notifications/email.channel.ts
import { NotificationChannel, NotificationMessage } from '../../domain/interfaces/notification.interface';
import { EmailConfig } from '../../configs/notification.config';
import nodemailer from 'nodemailer';
import logger from '../../configs/logger';

export class EmailChannel implements NotificationChannel {
    private transporter: nodemailer.Transporter;    constructor(private config: EmailConfig) {
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
        if (!this.config.to) {
            logger.warn('Email recipient is missing, skipping notification');
            return;
        }

        const htmlContent = this.formatMessage(message);

        try {
            await this.transporter.sendMail({
                from: this.config.from,
                to: this.config.to,
                subject: message.title,
                html: htmlContent
            });
            
            logger.info('Email notification sent successfully');
        } catch (error) {
            logger.error('Error sending email notification:', error);
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
