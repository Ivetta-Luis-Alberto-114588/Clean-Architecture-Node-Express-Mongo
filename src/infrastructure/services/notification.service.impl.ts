// src/infrastructure/services/notification.service.impl.ts
import { NotificationService, NotificationMessage, NotificationChannel } from '../../domain/interfaces/notification.interface';
import { NotificationConfig } from '../../configs/notification.config';
import { TelegramChannel } from '../notifications/telegram.channel';
import { EmailChannel } from '../notifications/email.channel';
import { TelegramAdapter } from '../adapters/telegram.adapter';
import { WinstonLoggerAdapter } from '../adapters/winston-logger.adapter';
import { ILogger } from '../../domain/interfaces/logger.interface';

export class NotificationServiceImpl implements NotificationService {
    private channels: NotificationChannel[] = [];
    private logger: ILogger;

    constructor(private config: NotificationConfig) {
        this.logger = new WinstonLoggerAdapter();
        this.initializeChannels();
    }

    private initializeChannels(): void {
        this.config.activeChannels.forEach(channelType => {
            try {
                switch (channelType) {
                    case 'telegram':
                        if (this.config.telegram && this.config.telegram.botToken && this.config.telegram.chatId) {
                            const telegramAdapter = new TelegramAdapter(
                                {
                                    botToken: this.config.telegram.botToken,
                                    defaultChatId: this.config.telegram.chatId
                                },
                                this.logger
                            );
                            this.channels.push(new TelegramChannel(telegramAdapter));
                            this.logger.info('Telegram notification channel initialized');
                        } else {
                            this.logger.warn('Telegram configuration incomplete, skipping channel');
                        }
                        break;
                    case 'email': if (this.config.email && this.config.email.user && this.config.email.to) {
                        this.channels.push(new EmailChannel(this.config.email));
                        this.logger.info('Email notification channel initialized');
                    } else {
                        this.logger.warn('Email configuration incomplete, skipping channel');
                    }
                        break;
                    default:
                        this.logger.warn(`Unknown notification channel type: ${channelType}`);
                }
            } catch (error) {
                this.logger.error(`Error initializing notification channel ${channelType}:`, error);
            }
        });

        if (this.channels.length === 0) {
            this.logger.warn('No notification channels were initialized');
        }
    } async notify(message: NotificationMessage): Promise<void> {
        if (this.channels.length === 0) {
            this.logger.warn('No notification channels available, skipping notification');
            return;
        }

        const promises = this.channels.map(channel =>
            channel.send(message).catch(error => {
                this.logger.error('Notification channel error:', error);
            })
        );

        await Promise.allSettled(promises);
        this.logger.info(`Notification sent through ${this.channels.length} channel(s)`);
    }
}
