import { UpdatePaymentStatusDto } from '../../../../../src/domain/dtos/payment/update-payment-status.dto';
import { MercadoPagoPaymentStatus } from '../../../../../src/domain/interfaces/payment/mercado-pago.interface';

describe('UpdatePaymentStatusDto', () => {
    it('should create a valid DTO with all required fields', () => {
        const props = {
            paymentId: 'pay-1',
            status: MercadoPagoPaymentStatus.APPROVED,
            providerPaymentId: 'prov-1',
            metadata: { foo: 'bar' }
        };
        const [error, dto] = UpdatePaymentStatusDto.create(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.status).toBe(MercadoPagoPaymentStatus.APPROVED);
    });

    it('should return error if paymentId is missing', () => {
        const { paymentId, ...rest } = {
            paymentId: 'pay-1',
            status: MercadoPagoPaymentStatus.APPROVED,
            providerPaymentId: 'prov-1',
        };
        const [error] = UpdatePaymentStatusDto.create(rest);
        expect(error).toBeDefined();
    });

    it('should return error if status is invalid', () => {
        const [error] = UpdatePaymentStatusDto.create({ paymentId: 'pay-1', status: 'invalid', providerPaymentId: 'prov-1' });
        expect(error).toBeDefined();
    });
});
