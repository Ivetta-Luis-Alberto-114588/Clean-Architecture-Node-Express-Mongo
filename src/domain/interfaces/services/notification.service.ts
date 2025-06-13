// src/domain/interfaces/services/notification.service.ts
export interface NotificationService {
    sendMessage(message: string, chatId?: string): Promise<void>;
    sendMessageToAdmin(message: string): Promise<void>;
    sendOrderNotification(orderData: {
        orderId: string;
        customerName: string;
        total: number;
        items: Array<{ name: string; quantity: number; price: number }>;
    }): Promise<void>;
    sendPaymentNotification(paymentData: {
        orderId: string;
        amount: number;
        paymentMethod: string;
        status: string;
    }): Promise<void>;
}
