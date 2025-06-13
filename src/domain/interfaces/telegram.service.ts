// src/domain/interfaces/telegram.service.ts

export interface TelegramMessage {
    text: string;
    chatId?: string;
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disableWebPagePreview?: boolean;
    disableNotification?: boolean;
}

export interface TelegramResponse {
    success: boolean;
    messageId?: number;
    error?: string;
}

export interface ITelegramService {
    sendMessage(message: TelegramMessage): Promise<TelegramResponse>;
    sendMessageToDefaultChat(text: string, parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'): Promise<TelegramResponse>;
    isConfigured(): boolean;
}
