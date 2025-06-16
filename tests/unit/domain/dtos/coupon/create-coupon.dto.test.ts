// tests/unit/domain/dtos/coupon/create-coupon.dto.test.ts
import { CreateCouponDto } from '../../../../../src/domain/dtos/coupon/create-coupon.dto';
import { DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';

describe('CreateCouponDto', () => {
    describe('create', () => {
        it('should create valid DTO when all required fields are provided', () => {
            const validData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.code).toBe('SAVE20');
            expect(dto!.discountType).toBe(DiscountType.PERCENTAGE);
            expect(dto!.discountValue).toBe(20);
            expect(dto!.isActive).toBe(true); // default value
        });

        it('should convert code to uppercase and trim spaces', () => {
            const validData = {
                code: '  save20  ',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.code).toBe('SAVE20');
        });

        it('should create DTO with all optional fields', () => {
            const validData = {
                code: 'FULLTEST',
                discountType: DiscountType.FIXED,
                discountValue: 50,
                description: 'Test coupon',
                isActive: false,
                validFrom: new Date('2025-01-01'),
                validUntil: new Date('2025-12-31'),
                minPurchaseAmount: 100,
                usageLimit: 50
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.description).toBe('Test coupon');
            expect(dto!.isActive).toBe(false);
            expect(dto!.validFrom).toEqual(new Date('2025-01-01'));
            expect(dto!.validUntil).toEqual(new Date('2025-12-31'));
            expect(dto!.minPurchaseAmount).toBe(100);
            expect(dto!.usageLimit).toBe(50);
        });

        // Code validation tests
        it('should return error when code is missing', () => {
            const invalidData = {
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El código del cupón es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when code is empty string', () => {
            const invalidData = {
                code: '',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El código del cupón es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when code is too short', () => {
            const invalidData = {
                code: 'AB',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El código debe tener al menos 3 caracteres');
            expect(dto).toBeUndefined();
        });

        // DiscountType validation tests
        it('should return error when discountType is missing', () => {
            const invalidData = {
                code: 'SAVE20',
                discountValue: 20
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El tipo de descuento es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when discountType is invalid', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: 'invalid',
                discountValue: 20
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toContain('El tipo de descuento debe ser');
            expect(dto).toBeUndefined();
        });

        // DiscountValue validation tests
        it('should return error when discountValue is missing', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El valor del descuento es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when discountValue is not a number', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 'twenty'
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El valor del descuento debe ser un número positivo');
            expect(dto).toBeUndefined();
        });

        it('should return error when discountValue is zero', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 0
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El valor del descuento debe ser un número positivo');
            expect(dto).toBeUndefined();
        });

        it('should return error when discountValue is negative', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: -10
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El valor del descuento debe ser un número positivo');
            expect(dto).toBeUndefined();
        });

        it('should return error when percentage discount is greater than 100', () => {
            const invalidData = {
                code: 'SAVE150',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 150
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El descuento porcentual no puede ser mayor a 100');
            expect(dto).toBeUndefined();
        });

        it('should accept fixed discount greater than 100', () => {
            const validData = {
                code: 'SAVE150',
                discountType: DiscountType.FIXED,
                discountValue: 150
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.discountValue).toBe(150);
        });

        // IsActive validation tests
        it('should return error when isActive is not boolean', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                isActive: 'true'
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('isActive debe ser booleano');
            expect(dto).toBeUndefined();
        });

        // Date validation tests
        it('should return error when validFrom is invalid date', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validFrom: 'invalid-date'
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('Fecha \'validFrom\' inválida');
            expect(dto).toBeUndefined();
        });

        it('should return error when validUntil is invalid date', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validUntil: 'invalid-date'
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('Fecha \'validUntil\' inválida');
            expect(dto).toBeUndefined();
        });

        it('should return error when validFrom is after validUntil', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validFrom: new Date('2025-12-31'),
                validUntil: new Date('2025-01-01')
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La fecha \'validFrom\' no puede ser posterior a \'validUntil\'');
            expect(dto).toBeUndefined();
        });

        // MinPurchaseAmount validation tests
        it('should return error when minPurchaseAmount is not a number', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                minPurchaseAmount: 'one hundred'
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El monto mínimo de compra debe ser un número no negativo');
            expect(dto).toBeUndefined();
        });

        it('should return error when minPurchaseAmount is negative', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                minPurchaseAmount: -50
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El monto mínimo de compra debe ser un número no negativo');
            expect(dto).toBeUndefined();
        });

        it('should accept zero minPurchaseAmount', () => {
            const validData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                minPurchaseAmount: 0
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.minPurchaseAmount).toBe(0);
        });

        // UsageLimit validation tests
        it('should return error when usageLimit is not an integer', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                usageLimit: 10.5
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El límite de uso debe ser un número entero no negativo');
            expect(dto).toBeUndefined();
        });

        it('should return error when usageLimit is negative', () => {
            const invalidData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                usageLimit: -5
            };

            const [error, dto] = CreateCouponDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El límite de uso debe ser un número entero no negativo');
            expect(dto).toBeUndefined();
        });

        it('should accept zero usageLimit', () => {
            const validData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                usageLimit: 0
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.usageLimit).toBe(0);
        });

        // Test null conversion for optional fields
        it('should convert undefined to null for optional numeric fields', () => {
            const validData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                minPurchaseAmount: undefined,
                usageLimit: undefined
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.minPurchaseAmount).toBe(null);
            expect(dto!.usageLimit).toBe(null);
        });

        it('should handle string dates correctly', () => {
            const validData = {
                code: 'SAVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validFrom: '2025-01-01',
                validUntil: '2025-12-31'
            };

            const [error, dto] = CreateCouponDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.validFrom).toEqual(new Date('2025-01-01'));
            expect(dto!.validUntil).toEqual(new Date('2025-12-31'));
        });
    });
});
