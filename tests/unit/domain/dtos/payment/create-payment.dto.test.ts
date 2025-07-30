import { CreatePaymentDto } from '../../../../../src/domain/dtos/payment/create-payment.dto';
import { PaymentProvider } from '../../../../../src/domain/entities/payment/payment.entity';

describe('CreatePaymentDto', () => {
    const validData = {
        saleId: 'sale-1',
        customerId: 'customer-1',
        amount: 100,
        provider: PaymentProvider.MERCADO_PAGO,
        items: [{ id: 'item-1', title: 'Producto', quantity: 1, unit_price: 100 }],
        payer: { email: 'test@test.com' },
        backUrls: { success: 's', failure: 'f', pending: 'p' },
        notificationUrl: 'http://notify',
    };

    it('should create a valid DTO with all required fields', () => {
        const [error, dto] = CreatePaymentDto.create(validData);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.saleId).toBe(validData.saleId);
        expect(dto!.amount).toBe(validData.amount);
        expect(dto!.items.length).toBe(1);
    });

    it('should return error if saleId is missing', () => {
        const { saleId, ...rest } = validData;
        const [error] = CreatePaymentDto.create(rest);
        expect(error).toBeDefined();
    });

    it('should return error if items is empty', () => {
        const [error] = CreatePaymentDto.create({ ...validData, items: [] });
        expect(error).toBeDefined();
    });

    it('should return error if payer.email is missing', () => {
        const [error] = CreatePaymentDto.create({ ...validData, payer: {} });
        expect(error).toBeDefined();
    });

    it('should generate idempotencyKey if not provided', () => {
        const [error, dto] = CreatePaymentDto.create(validData);
        expect(error).toBeUndefined();
        expect(dto!.idempotencyKey).toContain('payment-');
    });
});
