// tests/unit/domain/dtos/coupon/update-coupon.dto.test.ts
import { UpdateCouponDto } from '../../../../../src/domain/dtos/coupon/update-coupon.dto';
import { DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';

describe('UpdateCouponDto', () => {
    describe('update', () => {
        it('should create valid DTO when updating single field', () => {
            const validData = {
                code: 'NEWSAVE20'
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.code).toBe('NEWSAVE20');
            expect(dto!.discountType).toBeUndefined();
            expect(dto!.discountValue).toBeUndefined();
        });

        it('should create valid DTO when updating multiple fields', () => {
            const validData = {
                code: 'MULTISAVE',
                discountType: DiscountType.FIXED,
                discountValue: 50,
                isActive: false
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.code).toBe('MULTISAVE');
            expect(dto!.discountType).toBe(DiscountType.FIXED);
            expect(dto!.discountValue).toBe(50);
            expect(dto!.isActive).toBe(false);
        });

        it('should convert code to uppercase and trim spaces', () => {
            const validData = {
                code: '  newsave20  '
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.code).toBe('NEWSAVE20');
        });

        // Validation tests
        it('should return error when no fields are provided', () => {
            const invalidData = {};

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
            expect(dto).toBeUndefined();
        });

        // Code validation tests
        it('should return error when code is too short', () => {
            const invalidData = {
                code: 'AB'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El código debe tener al menos 3 caracteres');
            expect(dto).toBeUndefined();
        });

        it('should accept empty string code when updating other fields', () => {
            const validData = {
                code: '',
                isActive: true
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeDefined();
            expect(error).toBe('El código debe tener al menos 3 caracteres');
            expect(dto).toBeUndefined();
        });

        // DiscountType validation tests
        it('should return error when discountType is invalid', () => {
            const invalidData = {
                discountType: 'invalid'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toContain('El tipo de descuento debe ser');
            expect(dto).toBeUndefined();
        });

        it('should accept valid discountType', () => {
            const validData = {
                discountType: DiscountType.PERCENTAGE
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.discountType).toBe(DiscountType.PERCENTAGE);
        });

        // DiscountValue validation tests
        it('should return error when discountValue is not a number', () => {
            const invalidData = {
                discountValue: 'twenty'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El valor del descuento debe ser un número positivo');
            expect(dto).toBeUndefined();
        });

        it('should return error when discountValue is zero', () => {
            const invalidData = {
                discountValue: 0
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El valor del descuento debe ser un número positivo');
            expect(dto).toBeUndefined();
        });

        it('should return error when discountValue is negative', () => {
            const invalidData = {
                discountValue: -10
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El valor del descuento debe ser un número positivo');
            expect(dto).toBeUndefined();
        });

        it('should return error when percentage discount is greater than 100 with new discountType', () => {
            const invalidData = {
                discountType: DiscountType.PERCENTAGE,
                discountValue: 150
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El descuento porcentual no puede ser mayor a 100');
            expect(dto).toBeUndefined();
        });

        it('should return error when percentage discount is greater than 100 with existing discountType', () => {
            const invalidData = {
                discountValue: 150,
                existingDiscountType: DiscountType.PERCENTAGE
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El descuento porcentual no puede ser mayor a 100');
            expect(dto).toBeUndefined();
        });

        it('should accept fixed discount greater than 100', () => {
            const validData = {
                discountType: DiscountType.FIXED,
                discountValue: 150
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.discountValue).toBe(150);
        });

        // Description validation tests
        it('should accept empty string description', () => {
            const validData = {
                description: ''
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.description).toBe('');
        });

        it('should accept null description', () => {
            const validData = {
                description: null
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.description).toBe(null);
        });

        // IsActive validation tests
        it('should return error when isActive is not boolean', () => {
            const invalidData = {
                isActive: 'true'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('isActive debe ser booleano');
            expect(dto).toBeUndefined();
        });

        it('should accept boolean isActive', () => {
            const validData = {
                isActive: false
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.isActive).toBe(false);
        });

        // Date validation tests
        it('should accept null validFrom', () => {
            const validData = {
                validFrom: null
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.validFrom).toBe(null);
        });

        it('should accept valid validFrom date', () => {
            const validData = {
                validFrom: '2025-01-01'
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.validFrom).toEqual(new Date('2025-01-01'));
        });

        it('should return error when validFrom is invalid date', () => {
            const invalidData = {
                validFrom: 'invalid-date'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('Fecha \'validFrom\' inválida');
            expect(dto).toBeUndefined();
        });

        it('should accept null validUntil', () => {
            const validData = {
                validUntil: null
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.validUntil).toBe(null);
        });

        it('should accept valid validUntil date', () => {
            const validData = {
                validUntil: '2025-12-31'
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.validUntil).toEqual(new Date('2025-12-31'));
        });

        it('should return error when validUntil is invalid date', () => {
            const invalidData = {
                validUntil: 'invalid-date'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('Fecha \'validUntil\' inválida');
            expect(dto).toBeUndefined();
        });

        it('should return error when new validFrom is after new validUntil', () => {
            const invalidData = {
                validFrom: '2025-12-31',
                validUntil: '2025-01-01'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La fecha \'validFrom\' no puede ser posterior a \'validUntil\'');
            expect(dto).toBeUndefined();
        });

        it('should return error when new validFrom is after existing validUntil', () => {
            const invalidData = {
                validFrom: '2025-12-31',
                existingValidUntil: new Date('2025-06-01')
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La fecha \'validFrom\' no puede ser posterior a \'validUntil\'');
            expect(dto).toBeUndefined();
        });

        it('should return error when existing validFrom is after new validUntil', () => {
            const invalidData = {
                validUntil: '2025-01-01',
                existingValidFrom: new Date('2025-06-01')
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La fecha \'validFrom\' no puede ser posterior a \'validUntil\'');
            expect(dto).toBeUndefined();
        });

        // MinPurchaseAmount validation tests
        it('should accept null minPurchaseAmount', () => {
            const validData = {
                minPurchaseAmount: null
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.minPurchaseAmount).toBe(null);
        });

        it('should accept valid minPurchaseAmount', () => {
            const validData = {
                minPurchaseAmount: 100
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.minPurchaseAmount).toBe(100);
        });

        it('should accept zero minPurchaseAmount', () => {
            const validData = {
                minPurchaseAmount: 0
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.minPurchaseAmount).toBe(0);
        });

        it('should return error when minPurchaseAmount is not a number', () => {
            const invalidData = {
                minPurchaseAmount: 'one hundred'
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El monto mínimo de compra debe ser un número no negativo');
            expect(dto).toBeUndefined();
        });

        it('should return error when minPurchaseAmount is negative', () => {
            const invalidData = {
                minPurchaseAmount: -50
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El monto mínimo de compra debe ser un número no negativo');
            expect(dto).toBeUndefined();
        });

        // UsageLimit validation tests
        it('should accept null usageLimit', () => {
            const validData = {
                usageLimit: null
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.usageLimit).toBe(null);
        });

        it('should accept valid usageLimit', () => {
            const validData = {
                usageLimit: 50
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.usageLimit).toBe(50);
        });

        it('should accept zero usageLimit', () => {
            const validData = {
                usageLimit: 0
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.usageLimit).toBe(0);
        });

        it('should return error when usageLimit is not an integer', () => {
            const invalidData = {
                usageLimit: 10.5
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El límite de uso debe ser un número entero no negativo');
            expect(dto).toBeUndefined();
        });

        it('should return error when usageLimit is negative', () => {
            const invalidData = {
                usageLimit: -5
            };

            const [error, dto] = UpdateCouponDto.update(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El límite de uso debe ser un número entero no negativo');
            expect(dto).toBeUndefined();
        });

        // Complex scenario tests
        it('should handle updating all fields at once', () => {
            const validData = {
                code: 'FULLUPDATE',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 25,
                description: 'Updated description',
                isActive: true,
                validFrom: '2025-02-01',
                validUntil: '2025-11-30',
                minPurchaseAmount: 75,
                usageLimit: 100
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.code).toBe('FULLUPDATE');
            expect(dto!.discountType).toBe(DiscountType.PERCENTAGE);
            expect(dto!.discountValue).toBe(25);
            expect(dto!.description).toBe('Updated description');
            expect(dto!.isActive).toBe(true);
            expect(dto!.validFrom).toEqual(new Date('2025-02-01'));
            expect(dto!.validUntil).toEqual(new Date('2025-11-30'));
            expect(dto!.minPurchaseAmount).toBe(75);
            expect(dto!.usageLimit).toBe(100);
        });

        it('should handle clearing optional fields with null', () => {
            const validData = {
                description: null,
                validFrom: null,
                validUntil: null,
                minPurchaseAmount: null,
                usageLimit: null
            };

            const [error, dto] = UpdateCouponDto.update(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.description).toBe(null);
            expect(dto!.validFrom).toBe(null);
            expect(dto!.validUntil).toBe(null);
            expect(dto!.minPurchaseAmount).toBe(null);
            expect(dto!.usageLimit).toBe(null);
        });
    });
});
