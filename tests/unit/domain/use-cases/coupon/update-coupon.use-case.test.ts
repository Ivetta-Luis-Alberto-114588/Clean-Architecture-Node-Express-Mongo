// tests/unit/domain/use-cases/coupon/update-coupon.use-case.test.ts
import { UpdateCouponUseCase } from '../../../../../src/domain/use-cases/coupon/update-coupon.use-case';
import { UpdateCouponDto } from '../../../../../src/domain/dtos/coupon/update-coupon.dto';
import { CouponRepository } from '../../../../../src/domain/repositories/coupon/coupon.repository';
import { CouponEntity, DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

// Mock the UpdateCouponDto.update method
jest.mock('../../../../../src/domain/dtos/coupon/update-coupon.dto');

describe('UpdateCouponUseCase', () => {
    let useCase: UpdateCouponUseCase;
    let mockRepository: jest.Mocked<CouponRepository>;
    let mockUpdateCouponDto: jest.Mocked<typeof UpdateCouponDto>;

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

        mockUpdateCouponDto = UpdateCouponDto as jest.Mocked<typeof UpdateCouponDto>;

        useCase = new UpdateCouponUseCase(mockRepository);
    });

    describe('execute', () => {
        const couponId = '507f1f77bcf86cd799439011';
        const existingCoupon = new CouponEntity(
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

        const updateDto = {
            description: 'Updated summer discount',
            discountValue: 25,
            isActive: false
        } as UpdateCouponDto;

        const updatedCoupon = new CouponEntity(
            couponId,
            'SUMMER20',
            DiscountType.PERCENTAGE,
            25,
            'Updated summer discount',
            false,
            new Date('2025-06-01'),
            new Date('2025-08-31'),
            100,
            500,
            50,
            new Date(),
            new Date()
        );

        beforeEach(() => {
            // Reset all mocks
            jest.clearAllMocks();
        });

        it('should update coupon when it exists and validation passes', async () => {
            mockRepository.findById.mockResolvedValue(existingCoupon);
            mockUpdateCouponDto.update.mockReturnValue([undefined, updateDto]);
            mockRepository.update.mockResolvedValue(updatedCoupon);

            const result = await useCase.execute(couponId, updateDto);

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockUpdateCouponDto.update).toHaveBeenCalledWith({
                ...updateDto,
                existingDiscountType: existingCoupon.discountType,
                existingValidFrom: existingCoupon.validFrom,
                existingValidUntil: existingCoupon.validUntil,
            });
            expect(mockRepository.update).toHaveBeenCalledWith(couponId, updateDto);
            expect(result).toEqual(updatedCoupon);
        });

        it('should throw not found error when coupon does not exist', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(couponId, updateDto)).rejects.toThrow(
                CustomError.notFound(`Cupón con ID ${couponId} no encontrado.`)
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockRepository.findByCode).not.toHaveBeenCalled();
            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw error when trying to update to existing code', async () => {
            const updateDtoWithCode = {
                ...updateDto,
                code: 'EXISTING_CODE'
            } as UpdateCouponDto;

            const anotherCoupon = new CouponEntity(
                'another-id',
                'EXISTING_CODE',
                DiscountType.FIXED,
                50
            );

            mockRepository.findById.mockResolvedValue(existingCoupon);
            mockRepository.findByCode.mockResolvedValue(anotherCoupon);

            await expect(useCase.execute(couponId, updateDtoWithCode)).rejects.toThrow(
                CustomError.badRequest("El código de cupón 'EXISTING_CODE' ya está en uso.")
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockRepository.findByCode).toHaveBeenCalledWith('EXISTING_CODE');
            expect(mockRepository.update).not.toHaveBeenCalled();
        }); it('should allow updating to same code (case insensitive)', async () => {
            const updateDtoWithSameCode = {
                ...updateDto,
                code: 'summer20' // Same code but lowercase
            } as UpdateCouponDto;

            mockRepository.findById.mockResolvedValue(existingCoupon);
            // No se llama a findByCode porque 'summer20'.toUpperCase() === 'SUMMER20' (mismo código)
            mockUpdateCouponDto.update.mockReturnValue([undefined, updateDtoWithSameCode]);
            mockRepository.update.mockResolvedValue(updatedCoupon);

            const result = await useCase.execute(couponId, updateDtoWithSameCode);

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockRepository.findByCode).not.toHaveBeenCalled(); // No debe llamarse
            expect(result).toEqual(updatedCoupon);
        }); it('should allow updating to same code when found coupon is the same', async () => {
            const updateDtoWithCode = {
                ...updateDto,
                code: 'SUMMER20'
            } as UpdateCouponDto;

            mockRepository.findById.mockResolvedValue(existingCoupon);
            // No se llama a findByCode porque 'SUMMER20'.toUpperCase() === 'SUMMER20' (mismo código)
            mockUpdateCouponDto.update.mockReturnValue([undefined, updateDtoWithCode]);
            mockRepository.update.mockResolvedValue(updatedCoupon);

            const result = await useCase.execute(couponId, updateDtoWithCode);

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockRepository.findByCode).not.toHaveBeenCalled(); // No debe llamarse
            expect(result).toEqual(updatedCoupon);
        });

        it('should throw error when DTO validation fails', async () => {
            const validationError = 'Discount value cannot exceed 100% for percentage type';

            mockRepository.findById.mockResolvedValue(existingCoupon);
            mockUpdateCouponDto.update.mockReturnValue([validationError, undefined]);

            await expect(useCase.execute(couponId, updateDto)).rejects.toThrow(
                CustomError.badRequest(validationError)
            );

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockRepository.update).not.toHaveBeenCalled();
        });

        it('should throw not found error when update returns null', async () => {
            mockRepository.findById.mockResolvedValue(existingCoupon);
            mockUpdateCouponDto.update.mockReturnValue([undefined, updateDto]);
            mockRepository.update.mockResolvedValue(null);

            await expect(useCase.execute(couponId, updateDto)).rejects.toThrow(
                CustomError.notFound(`Cupón con ID ${couponId} no encontrado durante la actualización.`)
            );

            expect(mockRepository.update).toHaveBeenCalledWith(couponId, updateDto);
        });

        it('should throw CustomError when repository throws CustomError', async () => {
            const customError = CustomError.badRequest('Database constraint violation');

            mockRepository.findById.mockResolvedValue(existingCoupon);
            mockUpdateCouponDto.update.mockReturnValue([undefined, updateDto]);
            mockRepository.update.mockRejectedValue(customError);

            await expect(useCase.execute(couponId, updateDto)).rejects.toThrow(customError);
        });

        it('should throw internal server error when repository throws generic error', async () => {
            const genericError = new Error('Database connection failed');

            mockRepository.findById.mockResolvedValue(existingCoupon);
            mockUpdateCouponDto.update.mockReturnValue([undefined, updateDto]);
            mockRepository.update.mockRejectedValue(genericError);

            await expect(useCase.execute(couponId, updateDto)).rejects.toThrow(
                CustomError.internalServerError('Error al actualizar el cupón.')
            );
        });

        it('should handle update without code change', async () => {
            const updateWithoutCode = {
                description: 'New description',
                isActive: false
            } as UpdateCouponDto;

            mockRepository.findById.mockResolvedValue(existingCoupon);
            mockUpdateCouponDto.update.mockReturnValue([undefined, updateWithoutCode]);
            mockRepository.update.mockResolvedValue(updatedCoupon);

            const result = await useCase.execute(couponId, updateWithoutCode);

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockRepository.findByCode).not.toHaveBeenCalled();
            expect(result).toEqual(updatedCoupon);
        });

        it('should throw error when findById throws error', async () => {
            const error = new Error('Database error');
            mockRepository.findById.mockRejectedValue(error);

            await expect(useCase.execute(couponId, updateDto)).rejects.toThrow(error);

            expect(mockRepository.findById).toHaveBeenCalledWith(couponId);
            expect(mockRepository.update).not.toHaveBeenCalled();
        });
    });
});
