// tests/unit/domain/use-cases/coupon/create-coupon.use-case.test.ts
import { CreateCouponUseCase } from '../../../../../src/domain/use-cases/coupon/create-coupon.use-case';
import { CreateCouponDto } from '../../../../../src/domain/dtos/coupon/create-coupon.dto';
import { CouponRepository } from '../../../../../src/domain/repositories/coupon/coupon.repository';
import { CouponEntity, DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('CreateCouponUseCase', () => {
    let useCase: CreateCouponUseCase;
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

        useCase = new CreateCouponUseCase(mockRepository);
    });

    describe('execute', () => {
        const validDto: CreateCouponDto = {
            code: 'SUMMER20',
            discountType: DiscountType.PERCENTAGE,
            discountValue: 20,
            description: 'Summer discount',
            isActive: true,
            validFrom: new Date('2025-06-01'),
            validUntil: new Date('2025-08-31'),
            minPurchaseAmount: 100,
            usageLimit: 500
        } as CreateCouponDto;

        const expectedCoupon = new CouponEntity(
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
            0,
            new Date(),
            new Date()
        );

        it('should create coupon when code does not exist', async () => {
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(expectedCoupon);

            const result = await useCase.execute(validDto);

            expect(mockRepository.findByCode).toHaveBeenCalledWith('SUMMER20');
            expect(mockRepository.create).toHaveBeenCalledWith(validDto);
            expect(result).toEqual(expectedCoupon);
        });

        it('should throw error when coupon code already exists', async () => {
            const existingCoupon = new CouponEntity(
                '2',
                'SUMMER20',
                DiscountType.PERCENTAGE,
                15,
                'Existing coupon'
            );
            
            mockRepository.findByCode.mockResolvedValue(existingCoupon);

            await expect(useCase.execute(validDto)).rejects.toThrow(
                CustomError.badRequest("El código de cupón 'SUMMER20' ya existe.")
            );

            expect(mockRepository.findByCode).toHaveBeenCalledWith('SUMMER20');
            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should throw CustomError when repository.create throws CustomError', async () => {
            const customError = CustomError.badRequest('Validation error');
            
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockRejectedValue(customError);

            await expect(useCase.execute(validDto)).rejects.toThrow(customError);

            expect(mockRepository.findByCode).toHaveBeenCalledWith('SUMMER20');
            expect(mockRepository.create).toHaveBeenCalledWith(validDto);
        });

        it('should throw internal server error when repository.create throws generic error', async () => {
            const genericError = new Error('Database connection failed');
            
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockRejectedValue(genericError);

            await expect(useCase.execute(validDto)).rejects.toThrow(
                CustomError.internalServerError('Error al crear el cupón.')
            );

            expect(mockRepository.findByCode).toHaveBeenCalledWith('SUMMER20');
            expect(mockRepository.create).toHaveBeenCalledWith(validDto);
        });

        it('should throw internal server error when findByCode throws generic error', async () => {
            const genericError = new Error('Database connection failed');
            
            mockRepository.findByCode.mockRejectedValue(genericError);

            await expect(useCase.execute(validDto)).rejects.toThrow();

            expect(mockRepository.findByCode).toHaveBeenCalledWith('SUMMER20');
            expect(mockRepository.create).not.toHaveBeenCalled();
        });

        it('should handle repository returning null for existing coupon check', async () => {
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(expectedCoupon);

            const result = await useCase.execute(validDto);

            expect(result).toEqual(expectedCoupon);
            expect(mockRepository.findByCode).toHaveBeenCalledWith('SUMMER20');
            expect(mockRepository.create).toHaveBeenCalledWith(validDto);
        });
    });
});
