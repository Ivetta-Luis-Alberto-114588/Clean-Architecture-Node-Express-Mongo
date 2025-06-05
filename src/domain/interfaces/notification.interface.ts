// src/domain/interfaces/notification.interface.ts
export interface NotificationMessage {
    title: string;
    body: string;
    data?: Record<string, any>;
}

export interface NotificationChannel {
    send(message: NotificationMessage): Promise<void>;
}

export interface NotificationService {
    notify(message: NotificationMessage): Promise<void>;
}
