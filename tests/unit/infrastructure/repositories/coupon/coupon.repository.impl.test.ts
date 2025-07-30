import { CouponRepositoryImpl } from '../../../../../src/infrastructure/repositories/coupon/coupon.repository.impl';
import { CouponDataSource } from '../../../../../src/domain/datasources/coupon/coupon.datasource';
import { CreateCouponDto } from '../../../../../src/domain/dtos/coupon/create-coupon.dto';
import { UpdateCouponDto } from '../../../../../src/domain/dtos/coupon/update-coupon.dto';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';
import { CouponEntity } from '../../../../../src/domain/entities/coupon/coupon.entity';

describe('CouponRepositoryImpl', () => {
    let couponDataSource: jest.Mocked<CouponDataSource>;
    let repository: CouponRepositoryImpl;

    beforeEach(() => {
        couponDataSource = {
            findByCode: jest.fn(),
            incrementUsage: jest.fn(),
            create: jest.fn(),
            getAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as any;
        repository = new CouponRepositoryImpl(couponDataSource);
    });

    it('should call datasource.findByCode', async () => {
        const mockCoupon = {} as CouponEntity;
        couponDataSource.findByCode.mockResolvedValue(mockCoupon);
        const result = await repository.findByCode('code');
        expect(couponDataSource.findByCode).toHaveBeenCalledWith('code');
        expect(result).toBe(mockCoupon);
    });

    it('should call datasource.incrementUsage', async () => {
        couponDataSource.incrementUsage.mockResolvedValue();
        await repository.incrementUsage('id', 'session');
        expect(couponDataSource.incrementUsage).toHaveBeenCalledWith('id', 'session');
    });

    it('should call datasource.create', async () => {
        const dto = {} as CreateCouponDto;
        const mockCoupon = {} as CouponEntity;
        couponDataSource.create.mockResolvedValue(mockCoupon);
        const result = await repository.create(dto);
        expect(couponDataSource.create).toHaveBeenCalledWith(dto);
        expect(result).toBe(mockCoupon);
    });

    it('should call datasource.getAll', async () => {
        const dto = {} as PaginationDto;
        const mockCoupons = [{} as CouponEntity];
        couponDataSource.getAll.mockResolvedValue(mockCoupons);
        const result = await repository.getAll(dto);
        expect(couponDataSource.getAll).toHaveBeenCalledWith(dto);
        expect(result).toBe(mockCoupons);
    });

    it('should call datasource.findById', async () => {
        const mockCoupon = {} as CouponEntity;
        couponDataSource.findById.mockResolvedValue(mockCoupon);
        const result = await repository.findById('id');
        expect(couponDataSource.findById).toHaveBeenCalledWith('id');
        expect(result).toBe(mockCoupon);
    });

    it('should call datasource.update', async () => {
        const dto = {} as UpdateCouponDto;
        const mockCoupon = {} as CouponEntity;
        couponDataSource.update.mockResolvedValue(mockCoupon);
        const result = await repository.update('id', dto);
        expect(couponDataSource.update).toHaveBeenCalledWith('id', dto);
        expect(result).toBe(mockCoupon);
    });

    it('should call datasource.delete', async () => {
        const mockCoupon = {} as CouponEntity;
        couponDataSource.delete.mockResolvedValue(mockCoupon);
        const result = await repository.delete('id');
        expect(couponDataSource.delete).toHaveBeenCalledWith('id');
        expect(result).toBe(mockCoupon);
    });
});
