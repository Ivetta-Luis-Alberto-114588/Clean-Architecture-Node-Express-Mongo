import { CreateOrderStatusUseCase } from '../../../../../src/domain/use-cases/order/create-order-status.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { CreateOrderStatusDto } from '../../../../../src/domain/dtos/order/create-order-status.dto';

describe('CreateOrderStatusUseCase', () => {
    let orderStatusRepository: any;
    let useCase: CreateOrderStatusUseCase;
    const validDtoObj = {
        code: 'NEW',
        name: 'Nuevo',
        description: 'Estado inicial de pedido',
        color: '#123456',
        order: 1,
        isActive: true,
        isDefault: false,
        canTransitionTo: ['60f6c2f9b60b5c001c8d4e1a'],
    };

    beforeEach(() => {
        orderStatusRepository = {
            create: jest.fn(),
            findByCode: jest.fn(),
        };
        useCase = new CreateOrderStatusUseCase(orderStatusRepository);
    });

    it('should create order status when code is unique', async () => {
        orderStatusRepository.findByCode.mockResolvedValue(null);
        const [err, dto] = CreateOrderStatusDto.create(validDtoObj);
        expect(err).toBeUndefined();
        const mockEntity = {
            id: '1',
            ...validDtoObj,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        orderStatusRepository.create.mockResolvedValue(mockEntity);
        const result = await useCase.execute(dto!);
        expect(orderStatusRepository.findByCode).toHaveBeenCalledWith(validDtoObj.code);
        expect(orderStatusRepository.create).toHaveBeenCalledWith(dto);
        expect(result).toEqual(mockEntity);
    });

    it('should throw CustomError if code already exists', async () => {
        orderStatusRepository.findByCode.mockResolvedValue({ id: '1', ...validDtoObj });
        const [err, dto] = CreateOrderStatusDto.create(validDtoObj);
        expect(err).toBeUndefined();
        await expect(useCase.execute(dto!)).rejects.toBeInstanceOf(CustomError);
    });

    it('should throw CustomError if repository throws', async () => {
        orderStatusRepository.findByCode.mockResolvedValue(null);
        const [err, dto] = CreateOrderStatusDto.create(validDtoObj);
        expect(err).toBeUndefined();
        orderStatusRepository.create.mockRejectedValue(CustomError.internalServerError('fail'));
        await expect(useCase.execute(dto!)).rejects.toBeInstanceOf(CustomError);
    });
});
