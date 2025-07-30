import { UpdatePaymentMethodDto } from '../../../../../src/domain/dtos/payment/update-payment-method.dto';

describe('UpdatePaymentMethodDto', () => {
    it('should create a valid DTO with provided fields', () => {
        const props = {
            code: 'efectivo',
            name: 'Efectivo',
            description: 'Pago en efectivo',
            isActive: false,
            defaultOrderStatusId: 'status-id',
            requiresOnlinePayment: true,
            allowsManualConfirmation: false
        };
        const [error, dto] = UpdatePaymentMethodDto.create(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.code).toBe('EFECTIVO');
        expect(dto!.isActive).toBe(false);
    });

    it('should allow partial updates', () => {
        const [error, dto] = UpdatePaymentMethodDto.create({ name: 'Nuevo' });
        expect(error).toBeUndefined();
        expect(dto!.name).toBe('Nuevo');
        expect(dto!.code).toBeUndefined();
    });
});
