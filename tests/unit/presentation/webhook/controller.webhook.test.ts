import { WebhookController } from '../../../../src/presentation/webhook/controller.webhook';
import logger from '../../../../src/configs/logger';
import { MercadoPagoAdapter } from '../../../../src/infrastructure/adapters/mercado-pago.adapter';
import { MercadoPagoPayment, MercadoPagoPaymentStatus } from '../../../../src/domain/interfaces/payment/mercado-pago.interface';
import { WebhookLogModel } from '../../../../src/data/mongodb/models/webhook/webhook-log.model';

// Mock de los módulos
jest.mock('../../../../src/data/mongodb/models/webhook/webhook-log.model');
jest.mock('../../../../src/configs/logger');
jest.mock('../../../../src/infrastructure/adapters/mercado-pago.adapter');

// Cast para obtener el mock tipado
const mockWebhookLogModel = WebhookLogModel as jest.Mocked<typeof WebhookLogModel>;

describe('WebhookController', () => {
    let controller: WebhookController;
    let req: any;
    let res: any;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;
    let mockPaymentService: any;
    let mercadoPagoAdapter: jest.Mocked<MercadoPagoAdapter>;

    beforeEach(() => {
        // Reset de todos los mocks
        jest.clearAllMocks();

        // Mock del response object
        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn();
        res = { status: statusMock, json: jsonMock };

        // Mock del payment service
        mockPaymentService = {
            processWebhook: jest.fn()
        };

        // Mock del MercadoPago adapter
        mercadoPagoAdapter = {
            getPayment: jest.fn()
        } as any;

        // Reset WebhookLogModel mocks
        (mockWebhookLogModel.countDocuments as jest.Mock).mockReset();
        (mockWebhookLogModel.find as jest.Mock).mockReset();
        (mockWebhookLogModel.findById as jest.Mock).mockReset();
        (mockWebhookLogModel.aggregate as jest.Mock).mockReset();

        // Mock chain methods for find
        (mockWebhookLogModel.find as jest.Mock).mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([])
        });

        // Crear instancia del controller
        controller = new WebhookController(mockPaymentService, logger, mercadoPagoAdapter);
    });

    // Error tests
    it('should handle error in getAllWebhooks', async () => {
        req = { query: { page: 1, limit: 10 } };
        (mockWebhookLogModel.countDocuments as jest.Mock).mockRejectedValue(new Error('DB error'));

        await controller.getAllWebhooks(req as any, res as any);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Error interno del servidor'
        }));
    });

    it('should handle error in getWebhookById', async () => {
        req = { params: { id: 'err' } };
        (mockWebhookLogModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

        await controller.getWebhookById(req as any, res as any);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Error interno del servidor'
        }));
    });

    it('should handle error in getMercadoPagoDetails', async () => {
        req = { params: { id: 'err' } };
        (mockWebhookLogModel.findById as jest.Mock).mockRejectedValue(new Error('DB error'));

        await controller.getMercadoPagoDetails(req as any, res as any);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Error interno del servidor'
        }));
    });

    it('should handle error in getWebhookStats', async () => {
        req = {};
        (mockWebhookLogModel.aggregate as jest.Mock).mockRejectedValue(new Error('DB error'));

        await controller.getWebhookStats(req as any, res as any);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Error interno del servidor'
        }));
    });

    // Validation tests - Note: Controller actually returns 404, not 400 for missing params
    it('should return 404 if webhook not found in getWebhookById', async () => {
        req = { params: { id: 'notfound' } };
        (mockWebhookLogModel.findById as jest.Mock).mockResolvedValue(null);

        await controller.getWebhookById(req as any, res as any);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Webhook no encontrado'
        }));
    });

    it('should return 404 if webhook not found in getMercadoPagoDetails', async () => {
        req = { params: { id: 'notfound' } };
        (mockWebhookLogModel.findById as jest.Mock).mockResolvedValue(null);

        await controller.getMercadoPagoDetails(req as any, res as any);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Webhook no encontrado'
        }));
    });

    it('should handle MercadoPagoAdapter error in getMercadoPagoDetails', async () => {
        const webhookId = 'webhook-id';
        const mockWebhook = {
            _id: webhookId,
            eventType: 'payment',
            queryParams: { id: 'payment-123' },
            headers: {},
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent'
        };

        req = { params: { id: webhookId } };
        (mockWebhookLogModel.findById as jest.Mock).mockResolvedValue(mockWebhook);
        (mockWebhookLogModel.countDocuments as jest.Mock).mockResolvedValue(0);
        mercadoPagoAdapter.getPayment.mockRejectedValue(new Error('MP error'));

        await controller.getMercadoPagoDetails(req as any, res as any);

        // El método debe responder con 200 pero con error en mercadoPagoData
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            webhook: expect.any(Object),
            mercadoPagoData: expect.objectContaining({
                error: 'No se pudo obtener información del pago desde MercadoPago'
            })
        }));
    });

    it('should return 404 if webhook not found in getMercadoPagoDetails', async () => {
        req = { params: { id: 'non-existent-id' } };
        (mockWebhookLogModel.findById as jest.Mock).mockResolvedValue(null);

        await controller.getMercadoPagoDetails(req as any, res as any);

        expect(statusMock).toHaveBeenCalledWith(404);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Webhook no encontrado'
        }));
    });

    // Success tests
    it('should return 200 with webhooks when getAllWebhooks succeeds', async () => {
        req = { query: { page: '1', limit: '10' } };
        const mockWebhooks = [{ id: '1', data: 'test' }];

        (mockWebhookLogModel.countDocuments as jest.Mock).mockResolvedValue(1);
        (mockWebhookLogModel.find as jest.Mock).mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockWebhooks)
        });

        await controller.getAllWebhooks(req as any, res as any);

        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            total: 1,
            webhooks: mockWebhooks,
            pagination: expect.any(Object)
        }));
    });

    it('should return 200 with webhook when getWebhookById succeeds', async () => {
        req = { params: { id: 'valid-id' } };
        const mockWebhook = { id: 'valid-id', data: 'test' };
        (mockWebhookLogModel.findById as jest.Mock).mockResolvedValue(mockWebhook);

        await controller.getWebhookById(req as any, res as any);

        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            webhook: mockWebhook
        }));
    });

    it('should return 200 with stats when getWebhookStats succeeds', async () => {
        req = {};
        const mockGeneralStats = [{ _id: null, total: 10, processed: 8, successful: 6 }];
        const mockBySource = [{ _id: 'mercadopago', count: 10, processed: 8 }];
        const mockByEventType = [{ _id: 'payment', count: 10, processed: 8 }];

        (mockWebhookLogModel.aggregate as jest.Mock)
            .mockResolvedValueOnce(mockGeneralStats)
            .mockResolvedValueOnce(mockBySource)
            .mockResolvedValueOnce(mockByEventType);

        await controller.getWebhookStats(req as any, res as any);

        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            general: expect.any(Object),
            bySource: mockBySource,
            byEventType: mockByEventType
        }));
    });

    it('should return 200 with payment details when getMercadoPagoDetails succeeds', async () => {
        req = { params: { id: 'valid-id' } };
        const mockWebhook = {
            processingResult: { paymentId: 'payment-123' }
        };
        const mockPayment: Partial<MercadoPagoPayment> = {
            id: 123,
            status: MercadoPagoPaymentStatus.APPROVED,
            date_created: '2025-01-01T00:00:00.000Z',
            date_approved: '2025-01-01T00:00:00.000Z',
            date_last_updated: '2025-01-01T00:00:00.000Z',
            money_release_date: '2025-01-01T00:00:00.000Z',
            operation_type: 'regular_payment',
            payment_method_id: 'visa',
            payment_type_id: 'credit_card',
            status_detail: 'accredited',
            currency_id: 'ARS',
            description: 'Test payment',
            collector_id: 456,
            payer: {
                id: '789',
                name: 'Test',
                surname: 'User',
                email: 'test@test.com'
            },
            metadata: {},
            additional_info: {},
            transaction_amount: 100,
            transaction_amount_refunded: 0,
            coupon_amount: 0,
            external_reference: 'order-123',
            transaction_details: {
                net_received_amount: 95,
                total_paid_amount: 100,
                overpaid_amount: 0,
                installment_amount: 100
            },
            fee_details: [],
            statement_descriptor: '',
            installments: 1
        };

        (mockWebhookLogModel.findById as jest.Mock).mockResolvedValue(mockWebhook);
        mercadoPagoAdapter.getPayment.mockResolvedValue(mockPayment as MercadoPagoPayment);

        await controller.getMercadoPagoDetails(req as any, res as any);

        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            webhook: expect.any(Object),
            mercadoPagoData: expect.any(Object)
        }));
    });

});
