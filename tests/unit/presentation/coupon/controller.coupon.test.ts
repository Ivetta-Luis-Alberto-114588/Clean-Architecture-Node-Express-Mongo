import { CouponController } from '../../../../src/presentation/coupon/controller.coupon';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import { CreateCouponDto } from '../../../../src/domain/dtos/coupon/create-coupon.dto';
import { UpdateCouponDto } from '../../../../src/domain/dtos/coupon/update-coupon.dto';
import { PaginationDto } from '../../../../src/domain/dtos/shared/pagination.dto';
import { CouponEntity, DiscountType } from '../../../../src/domain/entities/coupon/coupon.entity';

// Mock Use Cases
jest.mock('../../../../src/domain/use-cases/coupon/create-coupon.use-case');
jest.mock('../../../../src/domain/use-cases/coupon/get-all-coupons.use-case');
jest.mock('../../../../src/domain/use-cases/coupon/get-coupon-by-id.use-case');
jest.mock('../../../../src/domain/use-cases/coupon/update-coupon.use-case');
jest.mock('../../../../src/domain/use-cases/coupon/delete-coupon.use-case');

import { CreateCouponUseCase } from '../../../../src/domain/use-cases/coupon/create-coupon.use-case';
import { GetAllCouponsUseCase } from '../../../../src/domain/use-cases/coupon/get-all-coupons.use-case';
import { GetCouponByIdUseCase } from '../../../../src/domain/use-cases/coupon/get-coupon-by-id.use-case';
import { UpdateCouponUseCase } from '../../../../src/domain/use-cases/coupon/update-coupon.use-case';
import { DeleteCouponUseCase } from '../../../../src/domain/use-cases/coupon/delete-coupon.use-case';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const createMockCoupon = (overrides: Partial<CouponEntity> = {}): CouponEntity => {
    return new CouponEntity(
        overrides.id || '1',
        overrides.code || 'TEST',
        overrides.discountType || DiscountType.PERCENTAGE,
        overrides.discountValue || 10,
        overrides.description || 'Test coupon',
        overrides.isActive !== undefined ? overrides.isActive : true,
        overrides.validFrom || null,
        overrides.validUntil || null,
        overrides.minPurchaseAmount || null,
        overrides.usageLimit || null,
        overrides.timesUsed || 0,
        overrides.createdAt || new Date(),
        overrides.updatedAt || new Date()
    );
};

describe('CouponController', () => {
    let controller: CouponController;
    let couponRepository: any;
    let mockCreateUseCase: jest.Mocked<CreateCouponUseCase>;
    let mockGetAllUseCase: jest.Mocked<GetAllCouponsUseCase>;
    let mockGetByIdUseCase: jest.Mocked<GetCouponByIdUseCase>;
    let mockUpdateUseCase: jest.Mocked<UpdateCouponUseCase>;
    let mockDeleteUseCase: jest.Mocked<DeleteCouponUseCase>;

    beforeEach(() => {
        couponRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAll: jest.fn(),
        };

        // Mock Use Case instances
        mockCreateUseCase = {
            execute: jest.fn(),
        } as any;
        mockGetAllUseCase = {
            execute: jest.fn(),
        } as any;
        mockGetByIdUseCase = {
            execute: jest.fn(),
        } as any;
        mockUpdateUseCase = {
            execute: jest.fn(),
        } as any;
        mockDeleteUseCase = {
            execute: jest.fn(),
        } as any;

        // Mock Use Case constructors
        (CreateCouponUseCase as jest.Mock).mockImplementation(() => mockCreateUseCase);
        (GetAllCouponsUseCase as jest.Mock).mockImplementation(() => mockGetAllUseCase);
        (GetCouponByIdUseCase as jest.Mock).mockImplementation(() => mockGetByIdUseCase);
        (UpdateCouponUseCase as jest.Mock).mockImplementation(() => mockUpdateUseCase);
        (DeleteCouponUseCase as jest.Mock).mockImplementation(() => mockDeleteUseCase);

        controller = new CouponController(couponRepository);
    });

    describe('createCoupon', () => {
        it('should create a coupon and return 201', async () => {
            const req: any = { body: { code: 'TEST', discount: 10 } };
            const res = mockResponse();
            const mockCoupon = createMockCoupon({ id: '1', code: 'TEST', discountValue: 10 });

            jest.spyOn(CreateCouponDto, 'create').mockReturnValue([undefined, { code: 'TEST', discount: 10 } as any]);
            mockCreateUseCase.execute.mockResolvedValue(mockCoupon);

            await controller.createCoupon(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCoupon);
        });

        it('should return 400 if DTO validation fails', async () => {
            const req: any = { body: {} };
            const res = mockResponse();

            jest.spyOn(CreateCouponDto, 'create').mockReturnValue(['error', undefined]);

            await controller.createCoupon(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'error' });
        });
    });

    describe('getAllCoupons', () => {
        it('should return paginated coupons', async () => {
            const req: any = { query: { page: 1, limit: 10 } };
            const res = mockResponse();
            const mockCoupons = [createMockCoupon({ id: '1' })];

            jest.spyOn(PaginationDto, 'create').mockReturnValue([undefined, { page: 1, limit: 10 } as any]);
            mockGetAllUseCase.execute.mockResolvedValue(mockCoupons);

            await controller.getAllCoupons(req, res);

            expect(res.json).toHaveBeenCalledWith(mockCoupons);
        });

        it('should return 400 if pagination is invalid', async () => {
            const req: any = { query: { page: 'a', limit: 10 } };
            const res = mockResponse();

            jest.spyOn(PaginationDto, 'create').mockReturnValue(['error', undefined]);

            await controller.getAllCoupons(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'error' });
        });
    });

    describe('getCouponById', () => {
        it('should return coupon by id', async () => {
            const req: any = { params: { id: '1' } };
            const res = mockResponse();
            const mockCoupon = createMockCoupon({ id: '1', code: 'TEST' });

            mockGetByIdUseCase.execute.mockResolvedValue(mockCoupon);

            await controller.getCouponById(req, res);

            expect(res.json).toHaveBeenCalledWith(mockCoupon);
        });

        it('should handle error', async () => {
            const req: any = { params: { id: '1' }, id: 'reqid' };
            const res = mockResponse();

            mockGetByIdUseCase.execute.mockRejectedValue(new Error('fail'));

            await controller.getCouponById(req, res);

            // Wait a bit for async error handling
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('updateCoupon', () => {
        it('should update coupon and return result', async () => {
            const req: any = { params: { id: '1' }, body: { discount: 20 } };
            const res = mockResponse();
            const existingCoupon = createMockCoupon({
                id: '1',
                discountType: DiscountType.PERCENTAGE,
                validFrom: new Date(),
                validUntil: new Date()
            });
            const updatedCoupon = createMockCoupon({ id: '1', discountValue: 20 });

            couponRepository.findById.mockResolvedValue(existingCoupon);
            jest.spyOn(UpdateCouponDto, 'update').mockReturnValue([undefined, { discount: 20 } as any]);
            mockUpdateUseCase.execute.mockResolvedValue(updatedCoupon);

            await controller.updateCoupon(req, res);

            // Wait a bit for async processing
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res.json).toHaveBeenCalledWith(updatedCoupon);
        });

        it('should return 400 if update DTO validation fails', async () => {
            const req: any = { params: { id: '1' }, body: {} };
            const res = mockResponse();
            const existingCoupon = createMockCoupon({
                id: '1',
                discountType: DiscountType.PERCENTAGE,
                validFrom: new Date(),
                validUntil: new Date()
            });

            couponRepository.findById.mockResolvedValue(existingCoupon);
            jest.spyOn(UpdateCouponDto, 'update').mockReturnValue(['error', undefined]);

            await controller.updateCoupon(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'error' });
        });

        it('should handle not found coupon', async () => {
            const req: any = { params: { id: '1' } };
            const res = mockResponse();

            couponRepository.findById.mockResolvedValue(null);

            await controller.updateCoupon(req, res);

            // Wait a bit for async error handling
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('deleteCoupon', () => {
        it('should delete coupon and return message', async () => {
            const req: any = { params: { id: '1' } };
            const res = mockResponse();
            const deletedCoupon = createMockCoupon({ id: '1' });

            mockDeleteUseCase.execute.mockResolvedValue(deletedCoupon);

            await controller.deleteCoupon(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: 'Cupón eliminado (o desactivado)',
                coupon: deletedCoupon
            });
        });

        it('should handle error', async () => {
            const req: any = { params: { id: '1' }, id: 'reqid' };
            const res = mockResponse();

            mockDeleteUseCase.execute.mockRejectedValue(new Error('fail'));

            await controller.deleteCoupon(req, res);

            // Wait a bit for async error handling
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
