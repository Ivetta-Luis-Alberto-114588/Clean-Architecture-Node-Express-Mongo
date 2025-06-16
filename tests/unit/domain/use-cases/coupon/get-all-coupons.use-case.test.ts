// tests/unit/domain/use-cases/coupon/get-all-coupons.use-case.test.ts
import { GetAllCouponsUseCase } from '../../../../../src/domain/use-cases/coupon/get-all-coupons.use-case';
import { CouponRepository } from '../../../../../src/domain/repositories/coupon/coupon.repository';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';
import { CouponEntity, DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('GetAllCouponsUseCase', () => {
    let useCase: GetAllCouponsUseCase;
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

        useCase = new GetAllCouponsUseCase(mockRepository);
    }); describe('execute', () => {
        const [paginationError, validPaginationDto] = PaginationDto.create(1, 10);
        expect(paginationError).toBeUndefined();

        const mockCoupons = [
            new CouponEntity(
                '1',
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
            ),
            new CouponEntity(
                '2',
                'WINTER50',
                DiscountType.FIXED,
                50,
                'Winter discount',
                true,
                new Date('2025-12-01'),
                new Date('2025-12-31'),
                200,
                100,
                25,
                new Date(),
                new Date()
            )
        ]; it('should return all coupons when repository call succeeds', async () => {
            mockRepository.getAll.mockResolvedValue(mockCoupons);

            const result = await useCase.execute(validPaginationDto!);

            expect(mockRepository.getAll).toHaveBeenCalledWith(validPaginationDto);
            expect(result).toEqual(mockCoupons);
            expect(result).toHaveLength(2);
        });

        it('should return empty array when no coupons exist', async () => {
            mockRepository.getAll.mockResolvedValue([]);

            const result = await useCase.execute(validPaginationDto);

            expect(mockRepository.getAll).toHaveBeenCalledWith(validPaginationDto);
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should throw CustomError when repository.getAll throws CustomError', async () => {
            const customError = CustomError.badRequest('Invalid pagination parameters');

            mockRepository.getAll.mockRejectedValue(customError);

            await expect(useCase.execute(validPaginationDto)).rejects.toThrow(customError);

            expect(mockRepository.getAll).toHaveBeenCalledWith(validPaginationDto);
        });

        it('should throw internal server error when repository.getAll throws generic error', async () => {
            const genericError = new Error('Database connection failed');

            mockRepository.getAll.mockRejectedValue(genericError);

            await expect(useCase.execute(validPaginationDto)).rejects.toThrow(
                CustomError.internalServerError('Error al obtener los cupones.')
            );

            expect(mockRepository.getAll).toHaveBeenCalledWith(validPaginationDto);
        }); it('should handle different pagination parameters', async () => {
            const [customError, customPagination] = PaginationDto.create(2, 5);
            expect(customError).toBeUndefined();
            const limitedCoupons = [mockCoupons[0]];

            mockRepository.getAll.mockResolvedValue(limitedCoupons);

            const result = await useCase.execute(customPagination!);

            expect(mockRepository.getAll).toHaveBeenCalledWith(customPagination);
            expect(result).toEqual(limitedCoupons);
            expect(result).toHaveLength(1);
        });

        it('should handle large page numbers', async () => {
            const [largeError, largePagination] = PaginationDto.create(100, 10);
            expect(largeError).toBeUndefined();

            mockRepository.getAll.mockResolvedValue([]);

            const result = await useCase.execute(largePagination!);

            expect(mockRepository.getAll).toHaveBeenCalledWith(largePagination);
            expect(result).toEqual([]);
        });

        it('should handle single coupon result', async () => {
            const singleCoupon = [mockCoupons[0]];

            mockRepository.getAll.mockResolvedValue(singleCoupon);

            const result = await useCase.execute(validPaginationDto);

            expect(mockRepository.getAll).toHaveBeenCalledWith(validPaginationDto);
            expect(result).toEqual(singleCoupon);
            expect(result).toHaveLength(1);
        });

        it('should preserve coupon properties in result', async () => {
            mockRepository.getAll.mockResolvedValue(mockCoupons);

            const result = await useCase.execute(validPaginationDto);

            expect(result[0].code).toBe('SUMMER20');
            expect(result[0].discountType).toBe(DiscountType.PERCENTAGE);
            expect(result[0].discountValue).toBe(20);
            expect(result[0].isActive).toBe(true);

            expect(result[1].code).toBe('WINTER50');
            expect(result[1].discountType).toBe(DiscountType.FIXED);
            expect(result[1].discountValue).toBe(50);
        });
    });
});
