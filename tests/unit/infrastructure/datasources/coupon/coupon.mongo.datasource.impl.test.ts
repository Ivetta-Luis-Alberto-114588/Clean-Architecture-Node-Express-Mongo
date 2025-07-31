import mongoose from 'mongoose';
import { CouponMongoDataSourceImpl } from '../../../../../src/infrastructure/datasources/coupon/coupon.mongo.datasource.impl';
import { CouponModel } from '../../../../../src/data/mongodb/models/coupon/coupon.model';
import { CouponMapper } from '../../../../../src/infrastructure/mappers/coupon/coupon.mapper';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { CreateCouponDto } from '../../../../../src/domain/dtos/coupon/create-coupon.dto';
import { UpdateCouponDto } from '../../../../../src/domain/dtos/coupon/update-coupon.dto';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';
import { DiscountType } from '../../../../../src/domain/entities/coupon/coupon.entity';

jest.mock('../../../../../src/data/mongodb/models/coupon/coupon.model');
jest.mock('../../../../../src/infrastructure/mappers/coupon/coupon.mapper');

const couponEntityMock = {
    id: 'id1',
    code: 'CODE',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    isActive: true,
    // Mock getters
    get isValidNow() { return true; },
    get isUsageLimitReached() { return false; }
};
const couponDocMock = { _id: 'id1', code: 'CODE', discountType: DiscountType.PERCENTAGE, discountValue: 10, isActive: true };

const sessionMock = {} as mongoose.ClientSession;

describe('CouponMongoDataSourceImpl', () => {
    let ds: CouponMongoDataSourceImpl;
    beforeEach(() => {
        jest.clearAllMocks();
        ds = new CouponMongoDataSourceImpl();
    });

    describe('findByCode', () => {
        it('returns entity if found', async () => {
            (CouponModel.findOne as any).mockResolvedValue(couponDocMock);
            (CouponMapper.fromObjectToCouponEntity as any).mockReturnValue(couponEntityMock);
            const result = await ds.findByCode('code');
            expect(result).toBe(couponEntityMock);
            expect(CouponModel.findOne).toHaveBeenCalledWith({ code: 'CODE' });
        });
        it('returns null if not found', async () => {
            (CouponModel.findOne as any).mockResolvedValue(null);
            const result = await ds.findByCode('code');
            expect(result).toBeNull();
        });
        it('throws on error', async () => {
            (CouponModel.findOne as any).mockRejectedValue(new Error('fail'));
            await expect(ds.findByCode('code')).rejects.toThrow('Error al buscar cupón por código.');
        });
    });

    describe('incrementUsage', () => {
        it('increments usage if found', async () => {
            (CouponModel.findByIdAndUpdate as any).mockResolvedValue(couponDocMock);
            await expect(ds.incrementUsage('id1', sessionMock)).resolves.toBeUndefined();
            expect(CouponModel.findByIdAndUpdate).toHaveBeenCalledWith('id1', { $inc: { timesUsed: 1 } }, { new: true, session: sessionMock });
        });
        it('throws notFound if not found', async () => {
            (CouponModel.findByIdAndUpdate as any).mockResolvedValue(null);
            await expect(ds.incrementUsage('id1')).rejects.toThrow('Cupón con ID id1 no encontrado para incrementar uso.');
        });
        it('throws on error', async () => {
            (CouponModel.findByIdAndUpdate as any).mockRejectedValue(new Error('fail'));
            await expect(ds.incrementUsage('id1')).rejects.toThrow('Error al incrementar el uso del cupón.');
        });
    });

    describe('create', () => {
        it('creates and returns entity', async () => {
            (CouponModel.create as any).mockResolvedValue(couponDocMock);
            (CouponMapper.fromObjectToCouponEntity as any).mockReturnValue(couponEntityMock);
            const dto = { code: 'code', discountType: DiscountType.PERCENTAGE, discountValue: 10 } as CreateCouponDto;
            const result = await ds.create(dto);
            expect(result).toBe(couponEntityMock);
            expect(CouponModel.create).toHaveBeenCalledWith({ ...dto, code: 'CODE' });
        });
        it('throws duplicate error', async () => {
            const error = { code: 11000 };
            (CouponModel.create as any).mockRejectedValue(error);
            await expect(ds.create({ code: 'code' } as any)).rejects.toThrow('ya existe');
        });
        it('throws validation error', async () => {
            const error = new mongoose.Error.ValidationError({} as any);
            (CouponModel.create as any).mockRejectedValue(error);
            await expect(ds.create({ code: 'code' } as any)).rejects.toThrow('Error de validación');
        });
        it('throws internal error', async () => {
            (CouponModel.create as any).mockRejectedValue(new Error('fail'));
            await expect(ds.create({ code: 'code' } as any)).rejects.toThrow('Error al crear el cupón.');
        });
    });

    describe('getAll', () => {
        it('returns mapped entities', async () => {
            (CouponModel.find as any).mockReturnValue({ limit: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([couponDocMock]) });
            (CouponMapper.fromObjectToCouponEntity as any).mockReturnValue(couponEntityMock);
            const result = await ds.getAll({ page: 1, limit: 10 } as PaginationDto);
            expect(result).toEqual([couponEntityMock]);
        });
        it('throws on error', async () => {
            (CouponModel.find as any).mockImplementation(() => { throw new Error('fail'); });
            await expect(ds.getAll({ page: 1, limit: 10 } as PaginationDto)).rejects.toThrow('Error al obtener los cupones.');
        });
    });

    describe('findById', () => {
        it('returns null for invalid id', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);
            const result = await ds.findById('badid');
            expect(result).toBeNull();
        });
        it('returns entity if found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findById as any).mockResolvedValue(couponDocMock);
            (CouponMapper.fromObjectToCouponEntity as any).mockReturnValue(couponEntityMock);
            const result = await ds.findById('id1');
            expect(result).toBe(couponEntityMock);
        });
        it('returns null if not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findById as any).mockResolvedValue(null);
            const result = await ds.findById('id1');
            expect(result).toBeNull();
        });
        it('throws on error', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findById as any).mockRejectedValue(new Error('fail'));
            await expect(ds.findById('id1')).rejects.toThrow('Error al buscar cupón por ID.');
        });
    });

    describe('update', () => {
        it('returns null for invalid id', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);
            const result = await ds.update('badid', {} as UpdateCouponDto);
            expect(result).toBeNull();
        });
        it('returns entity if updated', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndUpdate as any).mockResolvedValue(couponDocMock);
            (CouponMapper.fromObjectToCouponEntity as any).mockReturnValue(couponEntityMock);
            const dto = { code: 'code' } as UpdateCouponDto;
            const result = await ds.update('id1', dto);
            expect(result).toBe(couponEntityMock);
        });
        it('returns null if not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndUpdate as any).mockResolvedValue(null);
            const dto = { code: 'code' } as UpdateCouponDto;
            const result = await ds.update('id1', dto);
            expect(result).toBeNull();
        });
        it('returns current entity if no update fields', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            const findByIdSpy = jest.spyOn(ds, 'findById').mockResolvedValue(couponEntityMock);
            const result = await ds.update('id1', {} as UpdateCouponDto);
            expect(result).toBe(couponEntityMock);
            findByIdSpy.mockRestore();
        });
        it('throws duplicate error', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndUpdate as any).mockRejectedValue({ code: 11000 });
            await expect(ds.update('id1', { code: 'code' } as UpdateCouponDto)).rejects.toThrow('ya existe');
        });
        it('throws validation error', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndUpdate as any).mockRejectedValue(new mongoose.Error.ValidationError({} as any));
            await expect(ds.update('id1', { code: 'code' } as UpdateCouponDto)).rejects.toThrow('Error de validación');
        });
        it('throws internal error', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndUpdate as any).mockRejectedValue(new Error('fail'));
            await expect(ds.update('id1', { code: 'code' } as UpdateCouponDto)).rejects.toThrow('Error al actualizar el cupón.');
        });
    });

    describe('delete', () => {
        it('returns null for invalid id', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false);
            const result = await ds.delete('badid');
            expect(result).toBeNull();
        });
        it('returns entity if deleted', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndDelete as any).mockResolvedValue(couponDocMock);
            (CouponMapper.fromObjectToCouponEntity as any).mockReturnValue(couponEntityMock);
            const result = await ds.delete('id1');
            expect(result).toBe(couponEntityMock);
        });
        it('returns null if not found', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndDelete as any).mockResolvedValue(null);
            const result = await ds.delete('id1');
            expect(result).toBeNull();
        });
        it('throws internal error', async () => {
            jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true);
            (CouponModel.findByIdAndDelete as any).mockRejectedValue(new Error('fail'));
            await expect(ds.delete('id1')).rejects.toThrow('Error al eliminar el cupón.');
        });
    });
});
