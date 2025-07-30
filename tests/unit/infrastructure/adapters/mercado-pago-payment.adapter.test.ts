// tests/unit/infrastructure/adapters/mercado-pago-payment.adapter.test.ts

import { MercadoPagoPaymentAdapter } from '../../../../src/infrastructure/adapters/mercado-pago-payment.adapter';
import { ILogger } from '../../../../src/domain/interfaces/logger.interface';
import { PaymentPreference } from '../../../../src/domain/interfaces/payment.service';

describe('MercadoPagoPaymentAdapter', () => {
    let adapter: MercadoPagoPaymentAdapter;
    let mockLogger: jest.Mocked<ILogger>;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            http: jest.fn()
        };

        adapter = new MercadoPagoPaymentAdapter(
            {
                accessToken: 'test-access-token'
            },
            mockLogger
        );
    });

    describe('createPreference (error y logging)', () => {
        it('should log and throw on axios error', async () => {
            const adapterOk = new MercadoPagoPaymentAdapter(
                { accessToken: 'token' },
                mockLogger
            );
            jest.spyOn(adapterOk, 'isConfigured').mockReturnValue(true);
            // No se puede mockear método privado, así que solo mockeamos axios.post
            jest.spyOn(require('axios'), 'post').mockRejectedValueOnce(new Error('fail'));
            await expect(adapterOk.createPreference({
                items: [{ id: '1', title: 't', quantity: 1, unitPrice: 1 }]
            } as any)).rejects.toThrow();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('isConfigured', () => {
        it('should return true when access token is provided', () => {
            expect(adapter.isConfigured()).toBe(true);
        });

        it('should return false when access token is not provided', () => {
            const adapterWithoutToken = new MercadoPagoPaymentAdapter(
                { accessToken: '' },
                mockLogger
            );

            expect(adapterWithoutToken.isConfigured()).toBe(false);
        });
    });

    describe('validateWebhook', () => {
        it('should validate webhook notification', () => {
            const webhookNotification = {
                id: 'test-id',
                type: 'payment' as const,
                dateCreated: '2025-01-01T00:00:00Z',
                applicationId: 'app-id',
                userId: 'user-id',
                version: 1,
                apiVersion: 'v1',
                action: 'payment.created',
                liveMode: false,
                data: { id: 'payment-id' }
            };

            const result = adapter.validateWebhook(webhookNotification);

            expect(result).toBe(true);
            expect(mockLogger.info).toHaveBeenCalledWith('Validating webhook notification: test-id');
        });
    });

    describe('createPreference', () => {
        it('should throw error when not configured', async () => {
            const adapterWithoutToken = new MercadoPagoPaymentAdapter(
                { accessToken: '' },
                mockLogger
            );

            const preference: PaymentPreference = {
                items: [{
                    id: 'test-item',
                    title: 'Test Product',
                    quantity: 1,
                    unitPrice: 100
                }]
            };

            await expect(adapterWithoutToken.createPreference(preference))
                .rejects
                .toThrow('Mercado Pago service is not properly configured');
        });
    });
});
