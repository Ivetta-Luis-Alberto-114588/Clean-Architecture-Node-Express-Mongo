import { DeliveryMethodMongoDatasourceImpl } from '../../../../../src/infrastructure/datasources/delivery-methods/delivery-method.mongo.datasource.impl';
import { DeliveryMethodModel } from '../../../../../src/data/mongodb/models/delivery-method.model';
import { DeliveryMethodMapper } from '../../../../../src/infrastructure/mappers/delivery-methods/delivery-method.mapper';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { CreateDeliveryMethodDto } from '../../../../../src/domain/dtos/delivery-methods/create-delivery-method.dto';
import { UpdateDeliveryMethodDto } from '../../../../../src/domain/dtos/delivery-methods/update-delivery-method.dto';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';

jest.mock('../../../../../src/data/mongodb/models/delivery-method.model');
jest.mock('../../../../../src/infrastructure/mappers/delivery-methods/delivery-method.mapper');

const entityMock = {
    id: 'id1',
    code: 'SHIPPING',
    name: 'Envío',
    description: 'desc',
    requiresAddress: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};
const docMock = { _id: 'id1', code: 'SHIPPING', name: 'Envío', description: 'desc', requiresAddress: true, isActive: true };

describe('DeliveryMethodMongoDatasourceImpl', () => {
    let ds: DeliveryMethodMongoDatasourceImpl;
    beforeEach(() => {
        jest.clearAllMocks();
        ds = new DeliveryMethodMongoDatasourceImpl();
    });

    describe('create', () => {
        it('creates and returns entity', async () => {
            (DeliveryMethodModel.create as any).mockResolvedValue(docMock);
            (DeliveryMethodMapper.fromObjectToEntity as any).mockReturnValue(entityMock);
            const dto = { code: 'shipping', name: 'Envío' } as CreateDeliveryMethodDto;
            const result = await ds.create(dto);
            expect(result).toBe(entityMock);
            expect(DeliveryMethodModel.create).toHaveBeenCalledWith(dto);
        });
        it('throws duplicate error', async () => {
            (DeliveryMethodModel.create as any).mockRejectedValue({ code: 11000 });
            await expect(ds.create({ code: 'shipping', name: 'Envío' } as any)).rejects.toThrow('already exists');
        });
        it('throws internal error', async () => {
            (DeliveryMethodModel.create as any).mockRejectedValue(new Error('fail'));
            await expect(ds.create({ code: 'shipping', name: 'Envío' } as any)).rejects.toThrow('Internal server error');
        });
    });

    describe('getAll', () => {
        it('returns paginated entities', async () => {
            (DeliveryMethodModel.countDocuments as any).mockResolvedValue(1);
            (DeliveryMethodModel.find as any).mockReturnValue({ skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), sort: jest.fn().mockResolvedValue([docMock]) });
            (DeliveryMethodMapper.fromObjectToEntity as any).mockReturnValue(entityMock);
            const result = await ds.getAll({ page: 1, limit: 10 } as PaginationDto);
            expect(result).toEqual({ total: 1, items: [entityMock] });
        });
        it('throws on error', async () => {
            (DeliveryMethodModel.countDocuments as any).mockImplementation(() => { throw new Error('fail'); });
            await expect(ds.getAll({ page: 1, limit: 10 } as PaginationDto)).rejects.toThrow('Internal server error');
        });
    });

    describe('getActiveOnes', () => {
        it('returns active entities', async () => {
            (DeliveryMethodModel.find as any).mockReturnValue({ sort: jest.fn().mockResolvedValue([docMock]) });
            (DeliveryMethodMapper.fromObjectToEntity as any).mockReturnValue(entityMock);
            const result = await ds.getActiveOnes();
            expect(result).toEqual([entityMock]);
        });
        it('throws on error', async () => {
            (DeliveryMethodModel.find as any).mockImplementation(() => { throw new Error('fail'); });
            await expect(ds.getActiveOnes()).rejects.toThrow('Internal server error');
        });
    });

    describe('findById', () => {
        it('returns entity if found', async () => {
            (DeliveryMethodModel.findById as any).mockResolvedValue(docMock);
            (DeliveryMethodMapper.fromObjectToEntity as any).mockReturnValue(entityMock);
            const result = await ds.findById('id1');
            expect(result).toBe(entityMock);
        });
        it('returns null if not found', async () => {
            (DeliveryMethodModel.findById as any).mockResolvedValue(null);
            const result = await ds.findById('id1');
            expect(result).toBeNull();
        });
        it('throws on error', async () => {
            (DeliveryMethodModel.findById as any).mockRejectedValue(new Error('fail'));
            await expect(ds.findById('id1')).rejects.toThrow('Internal server error');
        });
    });

    describe('findByCode', () => {
        it('returns entity if found', async () => {
            (DeliveryMethodModel.findOne as any).mockResolvedValue(docMock);
            (DeliveryMethodMapper.fromObjectToEntity as any).mockReturnValue(entityMock);
            const result = await ds.findByCode('shipping');
            expect(result).toBe(entityMock);
            expect(DeliveryMethodModel.findOne).toHaveBeenCalledWith({ code: 'SHIPPING' });
        });
        it('returns null if not found', async () => {
            (DeliveryMethodModel.findOne as any).mockResolvedValue(null);
            const result = await ds.findByCode('shipping');
            expect(result).toBeNull();
        });
        it('throws on error', async () => {
            (DeliveryMethodModel.findOne as any).mockRejectedValue(new Error('fail'));
            await expect(ds.findByCode('shipping')).rejects.toThrow('Internal server error');
        });
    });

    describe('updateById', () => {
        it('returns updated entity', async () => {
            (DeliveryMethodModel.findByIdAndUpdate as any).mockResolvedValue(docMock);
            (DeliveryMethodMapper.fromObjectToEntity as any).mockReturnValue(entityMock);
            const dto = { name: 'Nuevo' } as UpdateDeliveryMethodDto;
            const result = await ds.updateById('id1', dto);
            expect(result).toBe(entityMock);
        });
        it('throws not found', async () => {
            (DeliveryMethodModel.findByIdAndUpdate as any).mockResolvedValue(null);
            await expect(ds.updateById('id1', { name: 'Nuevo' } as UpdateDeliveryMethodDto)).rejects.toThrow('not found');
        });
        it('throws duplicate error', async () => {
            (DeliveryMethodModel.findByIdAndUpdate as any).mockRejectedValue({ code: 11000 });
            await expect(ds.updateById('id1', { code: 'SHIPPING' } as UpdateDeliveryMethodDto)).rejects.toThrow('already exists');
        });
        it('throws internal error', async () => {
            (DeliveryMethodModel.findByIdAndUpdate as any).mockRejectedValue(new Error('fail'));
            await expect(ds.updateById('id1', { name: 'Nuevo' } as UpdateDeliveryMethodDto)).rejects.toThrow('Internal server error');
        });
    });

    describe('deleteById', () => {
        it('returns deleted entity', async () => {
            (DeliveryMethodModel.findByIdAndDelete as any).mockResolvedValue(docMock);
            (DeliveryMethodMapper.fromObjectToEntity as any).mockReturnValue(entityMock);
            const result = await ds.deleteById('id1');
            expect(result).toBe(entityMock);
        });
        it('throws not found', async () => {
            (DeliveryMethodModel.findByIdAndDelete as any).mockResolvedValue(null);
            await expect(ds.deleteById('id1')).rejects.toThrow('not found');
        });
        it('throws internal error', async () => {
            (DeliveryMethodModel.findByIdAndDelete as any).mockRejectedValue(new Error('fail'));
            await expect(ds.deleteById('id1')).rejects.toThrow('Internal server error');
        });
    });
});
