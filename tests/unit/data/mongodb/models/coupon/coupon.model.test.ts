// tests/unit/data/mongodb/models/coupon/coupon.model.test.ts
import mongoose from 'mongoose';
import { CouponModel, ICoupon } from '../../../../../../src/data/mongodb/models/coupon/coupon.model';
import { DiscountType } from '../../../../../../src/domain/entities/coupon/coupon.entity';

describe('CouponModel', () => {
    beforeEach(async () => {
        // Limpiar la colección antes de cada test
        await CouponModel.deleteMany({});
    });

    describe('Schema Validation', () => {
        it('should create a valid coupon with all required fields', async () => {
            const couponData = {
                code: 'VERANO20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                description: 'Descuento de verano del 20%',
                isActive: true,
                validFrom: new Date('2025-01-01'),
                validUntil: new Date('2025-12-31'),
                minPurchaseAmount: 100,
                usageLimit: 100,
                timesUsed: 0
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon._id).toBeDefined();
            expect(savedCoupon.code).toBe('VERANO20');
            expect(savedCoupon.discountType).toBe(DiscountType.PERCENTAGE);
            expect(savedCoupon.discountValue).toBe(20);
            expect(savedCoupon.description).toBe('Descuento de verano del 20%');
            expect(savedCoupon.isActive).toBe(true);
            expect(savedCoupon.timesUsed).toBe(0);
            expect(savedCoupon.createdAt).toBeDefined();
            expect(savedCoupon.updatedAt).toBeDefined();
        });

        it('should create a valid coupon with only required fields', async () => {
            const couponData = {
                code: 'SIMPLE10',
                discountType: DiscountType.FIXED,
                discountValue: 10
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.code).toBe('SIMPLE10');
            expect(savedCoupon.discountType).toBe(DiscountType.FIXED);
            expect(savedCoupon.discountValue).toBe(10);
            expect(savedCoupon.isActive).toBe(true); // default value
            expect(savedCoupon.timesUsed).toBe(0); // default value
            expect(savedCoupon.validFrom).toBeNull(); // default value
            expect(savedCoupon.validUntil).toBeNull(); // default value
            expect(savedCoupon.minPurchaseAmount).toBeNull(); // default value
            expect(savedCoupon.usageLimit).toBeNull(); // default value
        });

        it('should automatically uppercase the coupon code', async () => {
            const couponData = {
                code: 'lowercase20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.code).toBe('LOWERCASE20');
        });

        it('should trim whitespace from code and description', async () => {
            const couponData = {
                code: '  TRIM20  ',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                description: '  Descuento con espacios  '
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.code).toBe('TRIM20');
            expect(savedCoupon.description).toBe('Descuento con espacios');
        });
    });

    describe('Required Field Validations', () => {
        it('should throw error when code is missing', async () => {
            const couponData = {
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Coupon code is required');
        });

        it('should throw error when discountType is missing', async () => {
            const couponData = {
                code: 'TEST20',
                discountValue: 20
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Discount type is required');
        });

        it('should throw error when discountValue is missing', async () => {
            const couponData = {
                code: 'TEST20',
                discountType: DiscountType.PERCENTAGE
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Discount value is required');
        });
    });

    describe('Enum Validations', () => {
        it('should accept valid discount types', async () => {
            const percentageCoupon = new CouponModel({
                code: 'PERCENT20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            });

            const fixedCoupon = new CouponModel({
                code: 'FIXED10',
                discountType: DiscountType.FIXED,
                discountValue: 10
            });

            const savedPercentage = await percentageCoupon.save();
            const savedFixed = await fixedCoupon.save();

            expect(savedPercentage.discountType).toBe(DiscountType.PERCENTAGE);
            expect(savedFixed.discountType).toBe(DiscountType.FIXED);
        });

        it('should throw error for invalid discount type', async () => {
            const couponData = {
                code: 'INVALID20',
                discountType: 'invalid_type' as any,
                discountValue: 20
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow();
        });
    });

    describe('Numeric Validations', () => {
        it('should throw error when discountValue is negative', async () => {
            const couponData = {
                code: 'NEGATIVE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: -20
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Discount value cannot be negative');
        });

        it('should throw error when minPurchaseAmount is negative', async () => {
            const couponData = {
                code: 'MINPURCHASE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                minPurchaseAmount: -100
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Minimum purchase amount cannot be negative');
        });

        it('should throw error when usageLimit is negative', async () => {
            const couponData = {
                code: 'USAGE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                usageLimit: -10
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Usage limit cannot be negative');
        });

        it('should throw error when usageLimit is not an integer', async () => {
            const couponData = {
                code: 'DECIMAL20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                usageLimit: 10.5
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Usage limit must be an integer or null');
        });

        it('should throw error when timesUsed is negative', async () => {
            const couponData = {
                code: 'TIMES20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                timesUsed: -5
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Times used cannot be negative');
        });

        it('should accept zero values for numeric fields', async () => {
            const couponData = {
                code: 'ZERO20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 0,
                minPurchaseAmount: 0,
                usageLimit: 0,
                timesUsed: 0
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.discountValue).toBe(0);
            expect(savedCoupon.minPurchaseAmount).toBe(0);
            expect(savedCoupon.usageLimit).toBe(0);
            expect(savedCoupon.timesUsed).toBe(0);
        });
    });

    describe('Unique Code Validation', () => {
        it('should throw error when trying to create coupon with duplicate code', async () => {
            const couponData1 = {
                code: 'DUPLICATE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const couponData2 = {
                code: 'DUPLICATE20',
                discountType: DiscountType.FIXED,
                discountValue: 10
            };

            const coupon1 = new CouponModel(couponData1);
            await coupon1.save();

            const coupon2 = new CouponModel(couponData2);

            await expect(coupon2.save()).rejects.toThrow();
        });

        it('should allow same code in different cases (should be converted to uppercase)', async () => {
            const coupon1 = new CouponModel({
                code: 'same20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            });

            await coupon1.save();

            const coupon2 = new CouponModel({
                code: 'SAME20',
                discountType: DiscountType.FIXED,
                discountValue: 10
            });

            // Esto debería fallar porque ambos se convierten a 'SAME20'
            await expect(coupon2.save()).rejects.toThrow();
        });
    });

    describe('Pre-save Hook Validations', () => {
        it('should throw error when percentage discount exceeds 100', async () => {
            const couponData = {
                code: 'OVER100',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 150
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('Percentage discount cannot exceed 100.');
        });

        it('should allow percentage discount of exactly 100', async () => {
            const couponData = {
                code: 'EXACTLY100',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 100
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.discountValue).toBe(100);
        });

        it('should allow fixed discount greater than 100', async () => {
            const couponData = {
                code: 'FIXED200',
                discountType: DiscountType.FIXED,
                discountValue: 200
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.discountValue).toBe(200);
        });

        it('should throw error when validFrom is after validUntil', async () => {
            const couponData = {
                code: 'INVALID_DATES',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validFrom: new Date('2025-12-31'),
                validUntil: new Date('2025-01-01')
            };

            const coupon = new CouponModel(couponData);

            await expect(coupon.save()).rejects.toThrow('validFrom date cannot be after validUntil date.');
        });

        it('should allow equal validFrom and validUntil dates', async () => {
            const sameDate = new Date('2025-06-16');
            const couponData = {
                code: 'SAME_DATES',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validFrom: sameDate,
                validUntil: sameDate
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.validFrom).toEqual(sameDate);
            expect(savedCoupon.validUntil).toEqual(sameDate);
        });

        it('should allow null dates', async () => {
            const couponData = {
                code: 'NULL_DATES',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validFrom: null,
                validUntil: null
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.validFrom).toBeNull();
            expect(savedCoupon.validUntil).toBeNull();
        });

        it('should allow validFrom without validUntil', async () => {
            const couponData = {
                code: 'ONLY_FROM',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validFrom: new Date('2025-01-01')
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.validFrom).toEqual(new Date('2025-01-01'));
            expect(savedCoupon.validUntil).toBeNull();
        });

        it('should allow validUntil without validFrom', async () => {
            const couponData = {
                code: 'ONLY_UNTIL',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20,
                validUntil: new Date('2025-12-31')
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.validFrom).toBeNull();
            expect(savedCoupon.validUntil).toEqual(new Date('2025-12-31'));
        });
    });

    describe('Timestamps', () => {
        it('should automatically set createdAt and updatedAt on creation', async () => {
            const couponData = {
                code: 'TIMESTAMP20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();

            expect(savedCoupon.createdAt).toBeDefined();
            expect(savedCoupon.updatedAt).toBeDefined();
            expect(savedCoupon.createdAt).toEqual(savedCoupon.updatedAt);
        });

        it('should update updatedAt on modification', async () => {
            const couponData = {
                code: 'UPDATE20',
                discountType: DiscountType.PERCENTAGE,
                discountValue: 20
            };

            const coupon = new CouponModel(couponData);
            const savedCoupon = await coupon.save();
            const originalUpdatedAt = savedCoupon.updatedAt;

            // Esperar un poco para asegurar diferencia en timestamp
            await new Promise(resolve => setTimeout(resolve, 10));

            savedCoupon.description = 'Updated description';
            const updatedCoupon = await savedCoupon.save();

            expect(updatedCoupon.updatedAt).not.toEqual(originalUpdatedAt);
            expect(updatedCoupon.createdAt).toEqual(savedCoupon.createdAt);
        });
    });
    describe('Index Creation', () => {
        it('should have index on code field', async () => {
            const indexes = await CouponModel.collection.getIndexes();

            // Buscar índice que contenga el campo 'code'
            const hasCodeIndex = Object.values(indexes).some((index: any) => {
                return Array.isArray(index) && index.some((field: any) =>
                    field.key && field.key.code !== undefined
                );
            }) || indexes.code_1 !== undefined;

            expect(hasCodeIndex).toBeTruthy();
        });
    });
});
