// tests/unit/domain/use-cases/coupon/get-coupon-by-id.use-case.test.ts
import { GetCouponByIdUseCase } from '../../../../../src/domain/use-cases/coupon/get-coupon-by-id.use-case';
import { CouponRepository } from '../../../../../src/domain/repositories/coupon/coupon.repository';
import { CouponEntity, DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('GetCouponByIdUseCase', () => {
    let useCase: GetCouponByIdUseCase;
    let mockRepository: jest.Mocked<CouponRepository>;

    beforeEach(() => {
        mockRepository = {
            findByCode: jest.fn(),
            create: jest.fn(),
            incrementUsage: jest.fn(),
            getAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as jest.Mocked<CouponRepository>;

        useCase = new GetCouponByIdUseCase(mockRepository);
    });

    describe('execute', () => {
        const couponId = '507f1f77bcf86cd799439011';
        const mockCoupon = new CouponEntity(
            couponId,
            'SUMMER20',
            DiscountType.PERCENTAGE,
            20,
            'Summer discount',
            true,
            new Date('2025-06-01'),
            new Date('2025-08-31'),
            100,
            500,
            50,
            new Date(),
            new Date()
        );

        it('should return coupon when found by id', async () => {
            mockRepository.findById.mockResolvedValue(mockCoupon);

            const result = await useCase.execute(couponId);

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(result).toEqual(mockCoupon);
        });

        it('should throw not found error when coupon does not exist', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(couponId)).rejects.toThrow(
                CustomError.notFound(`Cupón con ID ${couponId} no encontrado.`)
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
        });

        it('should throw CustomError when repository.findById throws CustomError', async () => {
            const customError = CustomError.badRequest('Invalid ObjectId format');

            mockRepository.findById.mockRejectedValue(customError);

            await expect(useCase.execute(couponId)).rejects.toThrow(customError);

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
        });

        it('should throw internal server error when repository.findById throws generic error', async () => {
            const genericError = new Error('Database connection failed');

            mockRepository.findById.mockRejectedValue(genericError);

            await expect(useCase.execute(couponId)).rejects.toThrow(
                CustomError.internalServerError('Error al obtener el cupón por ID.')
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
        });

        it('should handle empty string ID', async () => {
            const emptyId = '';
            mockRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(emptyId)).rejects.toThrow(
                CustomError.notFound(`Cupón con ID ${emptyId} no encontrado.`)
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(emptyId);
        });

        it('should handle invalid ObjectId format', async () => {
            const invalidId = 'invalid-id-format';
            const error = new Error('Cast to ObjectId failed');

            mockRepository.findById.mockRejectedValue(error);

            await expect(useCase.execute(invalidId)).rejects.toThrow(
                CustomError.internalServerError('Error al obtener el cupón por ID.')
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(invalidId);
        });

        it('should return coupon with all properties when found', async () => {
            const fullCoupon = new CouponEntity(
                couponId,
                'WINTER50',
                DiscountType.FIXED,
                50,
                'Winter sale with detailed description',
                false,
                new Date('2025-12-01'),
                new Date('2025-12-31'),
                200,
                100,
                75,
                new Date('2025-11-01'),
                new Date('2025-11-15')
            );

            mockRepository.findById.mockResolvedValue(fullCoupon);

            const result = await useCase.execute(couponId);

            expect(result).toEqual(fullCoupon);
            expect(result.code).toBe('WINTER50');
            expect(result.discountType).toBe(DiscountType.FIXED);
            expect(result.discountValue).toBe(50);
            expect(result.description).toBe('Winter sale with detailed description');
            expect(result.isActive).toBe(false);
            expect(result.minPurchaseAmount).toBe(200);
            expect(result.usageLimit).toBe(100);
            expect(result.timesUsed).toBe(75);
        });

        it('should return coupon with minimal properties', async () => {
            const minimalCoupon = new CouponEntity(
                couponId,
                'BASIC10',
                DiscountType.PERCENTAGE,
                10
            );

            mockRepository.findById.mockResolvedValue(minimalCoupon);

            const result = await useCase.execute(couponId);

            expect(result).toEqual(minimalCoupon);
            expect(result.code).toBe('BASIC10');
            expect(result.discountType).toBe(DiscountType.PERCENTAGE);
            expect(result.discountValue).toBe(10);
        });

        it('should handle very long coupon ID', async () => {
            const longId = '507f1f77bcf86cd799439011507f1f77bcf86cd799439011';
            mockRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(longId)).rejects.toThrow(
                CustomError.notFound(`Cupón con ID ${longId} no encontrado.`)
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(longId);
        });
    });
});
