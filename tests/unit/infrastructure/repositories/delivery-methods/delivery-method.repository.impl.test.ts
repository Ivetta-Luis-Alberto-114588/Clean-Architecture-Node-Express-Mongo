import { DeliveryMethodRepositoryImpl } from '../../../../../src/infrastructure/repositories/delivery-methods/delivery-method.repository.impl';
import { DeliveryMethodDatasource } from '../../../../../src/domain/datasources/delivery-methods/delivery-method.datasource';
import { CreateDeliveryMethodDto } from '../../../../../src/domain/dtos/delivery-methods/create-delivery-method.dto';
import { UpdateDeliveryMethodDto } from '../../../../../src/domain/dtos/delivery-methods/update-delivery-method.dto';
import { DeliveryMethodEntity } from '../../../../../src/domain/entities/delivery-methods/delivery-method.entity';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';

describe('DeliveryMethodRepositoryImpl', () => {
    let datasource: jest.Mocked<DeliveryMethodDatasource>;
    let repository: DeliveryMethodRepositoryImpl;

    beforeEach(() => {
        datasource = {
            create: jest.fn(),
            getAll: jest.fn(),
            getActiveOnes: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            updateById: jest.fn(),
            deleteById: jest.fn(),
        } as any;
        repository = new DeliveryMethodRepositoryImpl(datasource);
    });

    it('should call datasource.create', async () => {
        const dto = {} as CreateDeliveryMethodDto;
        const entity = {} as DeliveryMethodEntity;
        datasource.create.mockResolvedValue(entity);
        const result = await repository.create(dto);
        expect(datasource.create).toHaveBeenCalledWith(dto);
        expect(result).toBe(entity);
    });

    it('should call datasource.getAll', async () => {
        const dto = {} as PaginationDto;
        const value = { total: 1, items: [{} as DeliveryMethodEntity] };
        datasource.getAll.mockResolvedValue(value);
        const result = await repository.getAll(dto);
        expect(datasource.getAll).toHaveBeenCalledWith(dto);
        expect(result).toBe(value);
    });

    it('should call datasource.getActiveOnes', async () => {
        const value = [{} as DeliveryMethodEntity];
        datasource.getActiveOnes.mockResolvedValue(value);
        const result = await repository.getActiveOnes();
        expect(datasource.getActiveOnes).toHaveBeenCalled();
        expect(result).toBe(value);
    });

    it('should call datasource.findById', async () => {
        const entity = {} as DeliveryMethodEntity;
        datasource.findById.mockResolvedValue(entity);
        const result = await repository.findById('id');
        expect(datasource.findById).toHaveBeenCalledWith('id');
        expect(result).toBe(entity);
    });

    it('should call datasource.findByCode', async () => {
        const entity = {} as DeliveryMethodEntity;
        datasource.findByCode.mockResolvedValue(entity);
        const result = await repository.findByCode('code');
        expect(datasource.findByCode).toHaveBeenCalledWith('code');
        expect(result).toBe(entity);
    });

    it('should call datasource.updateById', async () => {
        const entity = {} as DeliveryMethodEntity;
        const dto = {} as UpdateDeliveryMethodDto;
        datasource.updateById.mockResolvedValue(entity);
        const result = await repository.updateById('id', dto);
        expect(datasource.updateById).toHaveBeenCalledWith('id', dto);
        expect(result).toBe(entity);
    });

    it('should call datasource.deleteById', async () => {
        const entity = {} as DeliveryMethodEntity;
        datasource.deleteById.mockResolvedValue(entity);
        const result = await repository.deleteById('id');
        expect(datasource.deleteById).toHaveBeenCalledWith('id');
        expect(result).toBe(entity);
    });
});
