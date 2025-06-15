// tests/unit/domain/dtos/order/select-payment-method.dto.test.ts
import { SelectPaymentMethodDto } from '../../../../../src/domain/dtos/order/select-payment-method.dto';

describe('SelectPaymentMethodDto', () => {
    describe('create', () => {
        it('should create valid DTO when all required fields are provided', () => {
            const validData = {
                orderId: '507f1f77bcf86cd799439011',
                paymentMethodCode: 'CASH',
                notes: 'Test payment method selection'
            };

            const [error, dto] = SelectPaymentMethodDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.orderId).toBe(validData.orderId);
            expect(dto!.paymentMethodCode).toBe(validData.paymentMethodCode);
            expect(dto!.notes).toBe(validData.notes);
        });

        it('should create valid DTO without notes', () => {
            const validData = {
                orderId: '507f1f77bcf86cd799439011',
                paymentMethodCode: 'MERCADO_PAGO'
            };

            const [error, dto] = SelectPaymentMethodDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.orderId).toBe(validData.orderId);
            expect(dto!.paymentMethodCode).toBe(validData.paymentMethodCode);
            expect(dto!.notes).toBeUndefined();
        });

        it('should return error when orderId is missing', () => {
            const invalidData = {
                paymentMethodCode: 'CASH'
            };

            const [error, dto] = SelectPaymentMethodDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toContain('orderId');
            expect(dto).toBeUndefined();
        });

        it('should return error when paymentMethodCode is missing', () => {
            const invalidData = {
                orderId: '507f1f77bcf86cd799439011'
            };

            const [error, dto] = SelectPaymentMethodDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toContain('paymentMethodCode');
            expect(dto).toBeUndefined();
        }); it('should return error when orderId is invalid', () => {
            const invalidData = {
                orderId: 'not-a-valid-mongodb-id',
                paymentMethodCode: 'CASH'
            };

            const [error, dto] = SelectPaymentMethodDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toContain('ID de orden inválido');
            expect(dto).toBeUndefined();
        });

        it('should return error when paymentMethodCode is empty', () => {
            const invalidData = {
                orderId: '507f1f77bcf86cd799439011',
                paymentMethodCode: ''
            };

            const [error, dto] = SelectPaymentMethodDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toContain('paymentMethodCode');
            expect(dto).toBeUndefined();
        });

        it('should validate different payment method codes', () => {
            const paymentMethods = ['CASH', 'MERCADO_PAGO', 'BANK_TRANSFER'];
            const orderId = '507f1f77bcf86cd799439011';

            paymentMethods.forEach(code => {
                const [error, dto] = SelectPaymentMethodDto.create({
                    orderId,
                    paymentMethodCode: code
                });

                expect(error).toBeUndefined();
                expect(dto).toBeDefined();
                expect(dto!.paymentMethodCode).toBe(code);
            });
        });
    });
});
