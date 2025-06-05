// src/infrastructure/services/notification.service.impl.ts
import { NotificationService, NotificationMessage, NotificationChannel } from '../../domain/interfaces/notification.interface';
import { NotificationConfig } from '../../configs/notification.config';
import { TelegramChannel } from '../notifications/telegram.channel';
import { EmailChannel } from '../notifications/email.channel';
import logger from '../../configs/logger';

export class NotificationServiceImpl implements NotificationService {
    private channels: NotificationChannel[] = [];

    constructor(private config: NotificationConfig) {
        this.initializeChannels();
    }

    private initializeChannels(): void {
        this.config.activeChannels.forEach(channelType => {
            try {
                switch (channelType) {
                    case 'telegram':
                        if (this.config.telegram && this.config.telegram.botToken && this.config.telegram.chatId) {
                            this.channels.push(new TelegramChannel(this.config.telegram));
                            logger.info('Telegram notification channel initialized');
                        } else {
                            logger.warn('Telegram configuration incomplete, skipping channel');
                        }
                        break;
                    case 'email':
                        if (this.config.email && this.config.email.user && this.config.email.to) {
                            this.channels.push(new EmailChannel(this.config.email));
                            logger.info('Email notification channel initialized');
                        } else {
                            logger.warn('Email configuration incomplete, skipping channel');
                        }
                        break;
                    default:
                        logger.warn(`Unknown notification channel type: ${channelType}`);
                }
            } catch (error) {
                logger.error(`Error initializing notification channel ${channelType}:`, error);
            }
        });

        if (this.channels.length === 0) {
            logger.warn('No notification channels were initialized');
        }
    }

    async notify(message: NotificationMessage): Promise<void> {
        if (this.channels.length === 0) {
            logger.warn('No notification channels available, skipping notification');
            return;
        }

        const promises = this.channels.map(channel => 
            channel.send(message).catch(error => {
                logger.error('Notification channel error:', error);
            })
        );

        await Promise.allSettled(promises);
        logger.info(`Notification sent through ${this.channels.length} channel(s)`);
    }
}
