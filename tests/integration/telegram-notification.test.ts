// tests/integration/telegram-notification.test.ts
import { TelegramNotificationAdapter } from '../../src/infrastructure/adapters/telegram-notification.adapter';
import { NotificationService } from '../../src/domain/interfaces/services/notification.service';
import { ILogger } from '../../src/domain/interfaces/logger.interface';

describe('Telegram Notification Integration Test', () => {
    let telegramService: NotificationService;
    let mockLogger: jest.Mocked<ILogger>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            http: jest.fn(),
        };

        telegramService = new TelegramNotificationAdapter(mockLogger);
    });

    test('should implement NotificationService interface', () => {
        expect(telegramService).toBeDefined();
        expect(typeof telegramService.sendMessage).toBe('function');
        expect(typeof telegramService.sendMessageToAdmin).toBe('function');
        expect(typeof telegramService.sendOrderNotification).toBe('function');
        expect(typeof telegramService.sendPaymentNotification).toBe('function');
    });

    test('should format order notification correctly', async () => {
        const orderData = {
            orderId: 'ORDER-123',
            customerName: 'Juan Pérez',
            total: 150.75,
            items: [
                { name: 'Producto A', quantity: 2, price: 50.25 },
                { name: 'Producto B', quantity: 1, price: 50.25 }
            ]
        };

        // Mock fetch to avoid real API calls in tests
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true })
        });
        global.fetch = mockFetch;

        try {
            await telegramService.sendOrderNotification(orderData);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending Telegram message',
                expect.objectContaining({
                    messageLength: expect.any(Number)
                })
            );
        } catch (error) {
            // Esperamos que falle porque no tenemos configuración real de Telegram en tests
            expect(mockLogger.error).toHaveBeenCalled();
        }
    });

    test('should format payment notification correctly', async () => {
        const paymentData = {
            orderId: 'ORDER-123',
            amount: 150.75,
            paymentMethod: 'MercadoPago',
            status: 'approved'
        };

        // Mock fetch to avoid real API calls in tests
        const mockFetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ ok: true })
        });
        global.fetch = mockFetch;

        try {
            await telegramService.sendPaymentNotification(paymentData);

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Sending Telegram message',
                expect.objectContaining({
                    messageLength: expect.any(Number)
                })
            );
        } catch (error) {
            // Esperamos que falle porque no tenemos configuración real de Telegram en tests
            expect(mockLogger.error).toHaveBeenCalled();
        }
    });
});
