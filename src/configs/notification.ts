// src/configs/notification.ts
import { NotificationServiceImpl } from '../infrastructure/services/notification.service';
import { notificationConfig } from './notification.config';

export const notificationService = new NotificationServiceImpl(notificationConfig);
