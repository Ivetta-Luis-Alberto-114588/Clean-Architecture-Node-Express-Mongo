import { CouponEntity, DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';

describe('CouponEntity', () => {
    it('should create a CouponEntity with all properties', () => {
        const now = new Date();
        const coupon = new CouponEntity(
            'id1',
            'VERANO20',
            DiscountType.PERCENTAGE,
            20,
            'Descuento de verano',
            true,
            new Date(now.getTime() - 1000 * 60 * 60),
            new Date(now.getTime() + 1000 * 60 * 60),
            100,
            10,
            2,
            now,
            now
        );
        expect(coupon.id).toBe('id1');
        expect(coupon.code).toBe('VERANO20');
        expect(coupon.discountType).toBe(DiscountType.PERCENTAGE);
        expect(coupon.discountValue).toBe(20);
        expect(coupon.description).toBe('Descuento de verano');
        expect(coupon.isActive).toBe(true);
        expect(coupon.validFrom).toBeInstanceOf(Date);
        expect(coupon.validUntil).toBeInstanceOf(Date);
        expect(coupon.minPurchaseAmount).toBe(100);
        expect(coupon.usageLimit).toBe(10);
        expect(coupon.timesUsed).toBe(2);
        expect(coupon.createdAt).toBe(now);
        expect(coupon.updatedAt).toBe(now);
    });

    it('should return true for isValidNow if active and within date range', () => {
        const now = new Date();
        const coupon = new CouponEntity(
            'id2',
            'OTOÑO10',
            DiscountType.FIXED,
            10,
            undefined,
            true,
            new Date(now.getTime() - 1000 * 60 * 60),
            new Date(now.getTime() + 1000 * 60 * 60)
        );
        expect(coupon.isValidNow).toBe(true);
    });

    it('should return false for isValidNow if not active', () => {
        const coupon = new CouponEntity('id3', 'INACTIVO', DiscountType.FIXED, 5, undefined, false);
        expect(coupon.isValidNow).toBe(false);
    });

    it('should return false for isValidNow if before validFrom', () => {
        const now = new Date();
        const coupon = new CouponEntity(
            'id4',
            'FUTURO',
            DiscountType.PERCENTAGE,
            15,
            undefined,
            true,
            new Date(now.getTime() + 1000 * 60 * 60),
            new Date(now.getTime() + 1000 * 60 * 120)
        );
        expect(coupon.isValidNow).toBe(false);
    });

    it('should return false for isValidNow if after validUntil', () => {
        const now = new Date();
        const coupon = new CouponEntity(
            'id5',
            'PASADO',
            DiscountType.PERCENTAGE,
            15,
            undefined,
            true,
            new Date(now.getTime() - 1000 * 60 * 120),
            new Date(now.getTime() - 1000 * 60 * 60)
        );
        expect(coupon.isValidNow).toBe(false);
    });

    it('should return false for isUsageLimitReached if usageLimit is undefined', () => {
        const coupon = new CouponEntity('id6', 'SINLIMITE', DiscountType.FIXED, 5, undefined, true, undefined, undefined, undefined, undefined, 2);
        expect(coupon.isUsageLimitReached).toBe(false);
    });

    it('should return true for isUsageLimitReached if timesUsed >= usageLimit', () => {
        const coupon = new CouponEntity('id7', 'LIMITE', DiscountType.FIXED, 5, undefined, true, undefined, undefined, undefined, 2, 2);
        expect(coupon.isUsageLimitReached).toBe(true);
    });

    it('should return false for isUsageLimitReached if timesUsed < usageLimit', () => {
        const coupon = new CouponEntity('id8', 'LIMITE', DiscountType.FIXED, 5, undefined, true, undefined, undefined, undefined, 5, 2);
        expect(coupon.isUsageLimitReached).toBe(false);
    });

    it('should allow minimal constructor', () => {
        const coupon = new CouponEntity('id9', 'MIN', DiscountType.FIXED, 1);
        expect(coupon.id).toBe('id9');
        expect(coupon.code).toBe('MIN');
        expect(coupon.discountType).toBe(DiscountType.FIXED);
        expect(coupon.discountValue).toBe(1);
    });
});

describe('DiscountType', () => {
    it('should have correct enum values', () => {
        expect(DiscountType.PERCENTAGE).toBe('percentage');
        expect(DiscountType.FIXED).toBe('fixed');
    });
});
