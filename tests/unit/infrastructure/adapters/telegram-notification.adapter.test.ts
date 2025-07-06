// tests/unit/infrastructure/adapters/telegram-notification.adapter.test.ts
import { TelegramNotificationAdapter } from '../../../../src/infrastructure/adapters/telegram-notification.adapter';
import { ILogger } from '../../../../src/domain/interfaces/logger.interface';

// Mock de fetch global
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock del logger
const mockLogger: jest.Mocked<ILogger> = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn()
};

// Mock de las variables de entorno
jest.mock('../../../../src/configs/envs', () => ({
    envs: {
        TELEGRAM_BOT_TOKEN: 'test-bot-token',
        TELEGRAM_CHAT_ID: 'test-chat-id'
    }
}));

describe('TelegramNotificationAdapter', () => {
    let telegramAdapter: TelegramNotificationAdapter;

    beforeEach(() => {
        telegramAdapter = new TelegramNotificationAdapter(mockLogger);
        mockFetch.mockClear();
        mockLogger.info.mockClear();
        mockLogger.error.mockClear();
    });

    describe('sendMessage', () => {
        it('should send message successfully with default chat ID', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                url: 'https://api.telegram.org/bottest-bot-token/sendMessage',
                headers: new Map([['content-type', 'application/json']]),
                json: jest.fn().mockResolvedValue({ ok: true })
            };
            mockFetch.mockResolvedValue(mockResponse as any); await telegramAdapter.sendMessage('Test message');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.telegram.org/bottest-bot-token/sendMessage',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: 'test-chat-id',
                        text: 'Test message',
                        parse_mode: 'HTML'
                    })
                }
            );

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('=== INICIO ENVÍO MENSAJE ==='),
                expect.objectContaining({
                    chatId: 'test-chat-id',
                    messageLength: 12
                })
            );
        });

        it('should send message with custom chat ID', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                statusText: 'OK',
                url: 'https://api.telegram.org/bottest-bot-token/sendMessage',
                headers: {
                    get: jest.fn().mockReturnValue('application/json')
                },
                json: jest.fn().mockResolvedValue({ ok: true })
            };
            mockFetch.mockResolvedValue(mockResponse as any); await telegramAdapter.sendMessage('Test message', 'custom-chat-id');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.telegram.org/bottest-bot-token/sendMessage',
                expect.objectContaining({
                    body: JSON.stringify({
                        chat_id: 'custom-chat-id',
                        text: 'Test message',
                        parse_mode: 'HTML'
                    })
                })
            );
        });

        it('should throw error when Telegram API returns error', async () => {
            const mockResponse = {
                ok: false,
                json: jest.fn().mockResolvedValue({ description: 'Chat not found' })
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            await expect(telegramAdapter.sendMessage('Test message'))
                .rejects.toThrow('Telegram API error: Chat not found');

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('❌ [TelegramAdapter] Telegram API error'),
                expect.objectContaining({
                    chatId: 'test-chat-id',
                    messageLength: 12
                })
            );
        });

        it('should throw error when Telegram API returns error without description', async () => {
            const mockResponse = {
                ok: false,
                json: jest.fn().mockResolvedValue({})
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            await expect(telegramAdapter.sendMessage('Test message'))
                .rejects.toThrow('Telegram API error: Unknown error');
        });

        it('should handle network errors', async () => {
            const networkError = new Error('Network error');
            mockFetch.mockRejectedValue(networkError);

            await expect(telegramAdapter.sendMessage('Test message'))
                .rejects.toThrow('Network error');

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('💥 [TelegramAdapter] === ERROR CRÍTICO EN ENVÍO ==='),
                expect.objectContaining({
                    error: 'Network error',
                    chatId: 'test-chat-id',
                    messageLength: 12
                })
            );
        });
    });

    describe('sendMessageToAdmin', () => {
        it('should call sendMessage with default chat ID', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ ok: true })
            };
            mockFetch.mockResolvedValue(mockResponse as any); await telegramAdapter.sendMessageToAdmin('Admin message');

            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.telegram.org/bottest-bot-token/sendMessage',
                expect.objectContaining({
                    body: JSON.stringify({
                        chat_id: 'test-chat-id',
                        text: 'Admin message',
                        parse_mode: 'HTML'
                    })
                })
            );
        });
    });

    describe('sendOrderNotification', () => {
        it('should send formatted order notification', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ ok: true })
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            const orderData = {
                orderId: 'ORDER-123',
                customerName: 'John Doe',
                total: 150.75,
                items: [
                    { name: 'Product 1', quantity: 2, price: 50.25 },
                    { name: 'Product 2', quantity: 1, price: 50.25 }
                ]
            };

            await telegramAdapter.sendOrderNotification(orderData);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const callArgs = mockFetch.mock.calls[0];
            const requestBody = JSON.parse(callArgs[1]!.body as string);

            expect(requestBody.text).toContain('🛒 <b>Nueva Orden Recibida</b>');
            expect(requestBody.text).toContain('ORDER-123');
            expect(requestBody.text).toContain('John Doe');
            expect(requestBody.text).toContain('$150.75');
            expect(requestBody.text).toContain('Product 1 x2');
            expect(requestBody.text).toContain('Product 2 x1');
        });
    });

    describe('sendPaymentNotification', () => {
        it('should send approved payment notification', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ ok: true })
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            const paymentData = {
                orderId: 'ORDER-123',
                amount: 100.50,
                paymentMethod: 'Credit Card',
                status: 'approved'
            };

            await telegramAdapter.sendPaymentNotification(paymentData);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const callArgs = mockFetch.mock.calls[0];
            const requestBody = JSON.parse(callArgs[1]!.body as string);

            expect(requestBody.text).toContain('💳 <b>Notificación de Pago</b>');
            expect(requestBody.text).toContain('✅ <b>Estado:</b> APPROVED');
            expect(requestBody.text).toContain('ORDER-123');
            expect(requestBody.text).toContain('$100.50');
            expect(requestBody.text).toContain('Credit Card');
        });

        it('should send pending payment notification', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ ok: true })
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            const paymentData = {
                orderId: 'ORDER-456',
                amount: 75.25,
                paymentMethod: 'Bank Transfer',
                status: 'pending'
            };

            await telegramAdapter.sendPaymentNotification(paymentData);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const callArgs = mockFetch.mock.calls[0];
            const requestBody = JSON.parse(callArgs[1]!.body as string);

            expect(requestBody.text).toContain('⏳ <b>Estado:</b> PENDING');
        });

        it('should send failed payment notification', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ ok: true })
            };
            mockFetch.mockResolvedValue(mockResponse as any);

            const paymentData = {
                orderId: 'ORDER-789',
                amount: 200.00,
                paymentMethod: 'PayPal',
                status: 'failed'
            };

            await telegramAdapter.sendPaymentNotification(paymentData);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const callArgs = mockFetch.mock.calls[0];
            const requestBody = JSON.parse(callArgs[1]!.body as string);

            expect(requestBody.text).toContain('❌ <b>Estado:</b> FAILED');
        });
    });
});
