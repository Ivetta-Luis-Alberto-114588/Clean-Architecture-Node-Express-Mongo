// tests/unit/domain/use-cases/coupon/delete-coupon.use-case.test.ts
import { DeleteCouponUseCase } from '../../../../../src/domain/use-cases/coupon/delete-coupon.use-case';
import { CouponRepository } from '../../../../../src/domain/repositories/coupon/coupon.repository';
import { CouponEntity, DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('DeleteCouponUseCase', () => {
    let useCase: DeleteCouponUseCase;
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

        useCase = new DeleteCouponUseCase(mockRepository);
    });

    describe('execute', () => {
        const couponId = '507f1f77bcf86cd799439011';
        const deletedCoupon = new CouponEntity(
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
            0,
            new Date(),
            new Date()
        );

        it('should delete coupon when it exists', async () => {
            mockRepository.delete.mockResolvedValue(deletedCoupon);

            const result = await useCase.execute(couponId);

            expect(mockRepository.delete).toHaveBeenCalledWith(couponId);
            expect(result).toEqual(deletedCoupon);
        });

        it('should throw not found error when coupon does not exist', async () => {
            mockRepository.delete.mockResolvedValue(null);

            await expect(useCase.execute(couponId)).rejects.toThrow(
                CustomError.notFound(`Cupón con ID ${couponId} no encontrado.`)
            );

            expect(mockRepository.delete).toHaveBeenCalledWith(couponId);
        });

        it('should throw CustomError when repository.delete throws CustomError', async () => {
            const customError = CustomError.badRequest('Cannot delete coupon in use');

            mockRepository.delete.mockRejectedValue(customError);

            await expect(useCase.execute(couponId)).rejects.toThrow(customError);

            expect(mockRepository.delete).toHaveBeenCalledWith(couponId);
        });

        it('should throw internal server error when repository.delete throws generic error', async () => {
            const genericError = new Error('Database connection failed');

            mockRepository.delete.mockRejectedValue(genericError);

            await expect(useCase.execute(couponId)).rejects.toThrow(
                CustomError.internalServerError('Error al eliminar el cupón.')
            );

            expect(mockRepository.delete).toHaveBeenCalledWith(couponId);
        });

        it('should handle empty string ID', async () => {
            const emptyId = '';
            mockRepository.delete.mockResolvedValue(null);

            await expect(useCase.execute(emptyId)).rejects.toThrow(
                CustomError.notFound(`Cupón con ID ${emptyId} no encontrado.`)
            );

            expect(mockRepository.delete).toHaveBeenCalledWith(emptyId);
        });

        it('should handle invalid ObjectId format', async () => {
            const invalidId = 'invalid-id';
            const error = new Error('Invalid ObjectId');

            mockRepository.delete.mockRejectedValue(error);

            await expect(useCase.execute(invalidId)).rejects.toThrow(
                CustomError.internalServerError('Error al eliminar el cupón.')
            );

            expect(mockRepository.delete).toHaveBeenCalledWith(invalidId);
        });

        it('should successfully delete coupon with all fields populated', async () => {
            const fullCoupon = new CouponEntity(
                couponId,
                'WINTER50',
                DiscountType.FIXED,
                50,
                'Winter sale coupon',
                false,
                new Date('2025-12-01'),
                new Date('2025-12-31'),
                200,
                100,
                25,
                new Date('2025-11-01'),
                new Date('2025-11-15')
            );

            mockRepository.delete.mockResolvedValue(fullCoupon);

            const result = await useCase.execute(couponId);

            expect(result).toEqual(fullCoupon);
            expect(mockRepository.delete).toHaveBeenCalledWith(couponId);
        });
    });
});
