import { VerifyPaymentDto } from '../../../../../src/domain/dtos/payment/verify-payment.dto';

describe('VerifyPaymentDto', () => {
    describe('create', () => {
        it('should create valid DTO when all required fields are provided', () => {
            const validData = {
                paymentId: '123456',
                providerPaymentId: 'prov-789',
            };
            const [error, dto] = VerifyPaymentDto.create(validData);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.paymentId).toBe(validData.paymentId);
            expect(dto!.providerPaymentId).toBe(validData.providerPaymentId);
        });

        it('should return error when required field is missing', () => {
            const invalidData = {
                providerPaymentId: 'prov-789',
            };
            const [error, dto] = VerifyPaymentDto.create(invalidData);
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error when amount is not a number', () => {
            const invalidData = {
                paymentId: '123456',
            };
            const [error, dto] = VerifyPaymentDto.create(invalidData);
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });
    });
});
