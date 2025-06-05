// src/configs/notification.config.ts
import { config } from 'dotenv';

// Cargar variables de entorno
config();

export interface TelegramConfig {
    botToken: string;
    chatId: string;
}

export interface EmailConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    to: string;
}

export interface NotificationConfig {
    telegram?: TelegramConfig;
    email?: EmailConfig;
    activeChannels: ('telegram' | 'email')[];
}

export const notificationConfig: NotificationConfig = {
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || ''
    },
    email: {
        host: process.env.EMAIL_SERVICE === 'gmail' ? 'smtp.gmail.com' : 'smtp.gmail.com',
        port: process.env.EMAIL_SERVICE === 'gmail' ? 587 : 587,
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASS || '',
        from: `"${process.env.EMAIL_SENDER_NAME || 'Sistema de Ventas'}" <${process.env.EMAIL_USER || ''}>`,
        to: process.env.EMAIL_USER || '' // Por defecto envía al mismo email configurado
    },
    activeChannels: (process.env.NOTIFICATION_CHANNELS?.split(',') as ('telegram' | 'email')[]) || ['email']
};
