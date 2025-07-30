import { CreatePaymentMethodDto } from '../../../../../src/domain/dtos/payment/create-payment-method.dto';

describe('CreatePaymentMethodDto', () => {
    it('should create a valid DTO when all fields are provided', () => {
        const props = {
            code: 'efectivo',
            name: 'Efectivo',
            description: 'Pago en efectivo',
            isActive: true,
            defaultOrderStatusId: 'status-id',
            requiresOnlinePayment: false,
            allowsManualConfirmation: true
        };
        const [error, dto] = CreatePaymentMethodDto.create(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.code).toBe('EFECTIVO');
        expect(dto!.name).toBe('Efectivo');
        expect(dto!.isActive).toBe(true);
    });

    it('should return error if required fields are missing', () => {
        const [error, dto] = CreatePaymentMethodDto.create({});
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should trim and uppercase code', () => {
        const props = {
            code: '  mp  ',
            name: 'Mercado Pago',
            description: 'Pago online',
            isActive: true,
            defaultOrderStatusId: 'status-id',
            requiresOnlinePayment: true,
            allowsManualConfirmation: false
        };
        const [error, dto] = CreatePaymentMethodDto.create(props);
        expect(error).toBeUndefined();
        expect(dto!.code).toBe('MP');
    });
});
