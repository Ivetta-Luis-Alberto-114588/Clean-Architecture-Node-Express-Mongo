// src/domain/use-cases/notification/notify-order.use-case.ts
import { NotificationService, NotificationMessage } from '../../interfaces/notification.interface';
import { OrderEntity } from '../../entities/order/order.entity';
import logger from '../../../configs/logger';

export interface OrderNotificationData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    total: number;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    createdAt: Date;
    shippingAddress?: string;
}

export interface INotifyOrderUseCase {
    execute(orderData: OrderNotificationData): Promise<void>;
}

export class NotifyOrderUseCase implements INotifyOrderUseCase {
    constructor(private notificationService: NotificationService) {}

    async execute(orderData: OrderNotificationData): Promise<void> {
        try {
            const message: NotificationMessage = {
                title: '🛒 Nueva Orden Recibida!',
                body: `Se ha generado una nueva orden de ${orderData.customerName} por un total de $${orderData.total.toFixed(2)}`,
                data: {
                    'ID de Orden': orderData.orderId,
                    'Cliente': orderData.customerName,
                    'Email': orderData.customerEmail,
                    'Total': `$${orderData.total.toFixed(2)}`,
                    'Productos': orderData.items.map(item => 
                        `${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
                    ).join(', '),
                    'Fecha': orderData.createdAt.toLocaleString('es-AR', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    ...(orderData.shippingAddress && { 'Dirección de Envío': orderData.shippingAddress })
                }
            };

            await this.notificationService.notify(message);
            logger.info(`Order notification sent successfully for order: ${orderData.orderId}`);
        } catch (error) {
            logger.error(`Error sending order notification for order ${orderData.orderId}:`, error);
            // No re-lanzamos el error para que la creación de la orden no falle por problemas de notificación
        }
    }

    // Método estático para crear OrderNotificationData desde OrderEntity
    static fromOrderEntity(order: OrderEntity): OrderNotificationData {
        return {
            orderId: order.id,
            customerName: order.customer.name,
            customerEmail: order.customer.email,
            total: order.total,
            items: order.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.unitPrice
            })),
            createdAt: order.date,
            shippingAddress: order.shippingDetails ? 
                `${order.shippingDetails.streetAddress}, ${order.shippingDetails.neighborhoodName}, ${order.shippingDetails.cityName}` : 
                undefined
        };
    }
}
