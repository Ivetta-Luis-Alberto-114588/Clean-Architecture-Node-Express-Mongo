// src/infrastructure/telegramService.ts
import { notificationConfig } from '../configs/notification.config';
import { ITelegramService, TelegramMessage, TelegramResponse } from '../domain/interfaces/telegram.service';

class TelegramService implements ITelegramService {
    private chatId: string;
    private botToken: string;

    constructor() {
        this.chatId = notificationConfig.telegram?.chatId || '';
        this.botToken = notificationConfig.telegram?.botToken || '';
    }

    isConfigured(): boolean {
        return !!(this.botToken && this.chatId);
    }

    async sendMessage(message: TelegramMessage): Promise<TelegramResponse> {
        console.log(`[TELEGRAM] Sending message:`, message);
        // En producción, aquí iría la llamada real a la API de Telegram
        return { success: true, messageId: Date.now() };
    }

    async sendMessageToDefaultChat(text: string, parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'): Promise<TelegramResponse> {
        console.log(`[TELEGRAM] Sending to default chat (${this.chatId}): ${text} [${parseMode}]`);
        // En producción, aquí iría la llamada real a la API de Telegram
        return { success: true, messageId: Date.now() };
    }
}

export const telegramService = new TelegramService();
