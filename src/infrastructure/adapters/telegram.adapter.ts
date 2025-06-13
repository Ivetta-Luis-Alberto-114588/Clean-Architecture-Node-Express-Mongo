// src/infrastructure/adapters/telegram.adapter.ts

import axios from 'axios';
import { ITelegramService, TelegramMessage, TelegramResponse } from '../../domain/interfaces/telegram.service';
import { ILogger } from '../../domain/interfaces/logger.interface';

export interface TelegramAdapterConfig {
    botToken: string;
    defaultChatId?: string;
}

export class TelegramAdapter implements ITelegramService {
    private readonly baseUrl: string;

    constructor(
        private readonly config: TelegramAdapterConfig,
        private readonly logger: ILogger
    ) {
        this.baseUrl = `https://api.telegram.org/bot${this.config.botToken}`;
    }

    async sendMessage(message: TelegramMessage): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            this.logger.warn('Telegram service is not properly configured');
            return { success: false, error: 'Telegram not configured' };
        }

        const chatId = message.chatId || this.config.defaultChatId;

        if (!chatId) {
            this.logger.error('No chat ID provided and no default chat ID configured');
            return { success: false, error: 'No chat ID available' };
        }

        try {
            const response = await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: chatId,
                text: message.text,
                parse_mode: message.parseMode || 'HTML',
                disable_web_page_preview: message.disableWebPagePreview || false,
                disable_notification: message.disableNotification || false
            });

            if (response.data.ok) {
                this.logger.info(`Telegram message sent successfully to chat ${chatId}`);
                return {
                    success: true,
                    messageId: response.data.result.message_id
                };
            } else {
                this.logger.error('Telegram API returned error:', response.data);
                return {
                    success: false,
                    error: response.data.description || 'Unknown Telegram API error'
                };
            }
        } catch (error) {
            this.logger.error('Error sending Telegram message:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async sendMessageToDefaultChat(
        text: string,
        parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML'
    ): Promise<TelegramResponse> {
        return this.sendMessage({
            text,
            parseMode
        });
    }

    isConfigured(): boolean {
        return !!(this.config.botToken && this.config.defaultChatId);
    }
}
