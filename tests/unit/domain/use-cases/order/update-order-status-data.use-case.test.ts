
import { UpdateOrderStatusDataUseCase } from '../../../../../src/domain/use-cases/order/update-order-status-data.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { UpdateOrderStatusDataDto } from '../../../../../src/domain/dtos/order/update-order-status-data.dto';

describe('UpdateOrderStatusDataUseCase', () => {
    let orderStatusRepository: any;
    let logger: any;
    let useCase: UpdateOrderStatusDataUseCase;
    let validDto: UpdateOrderStatusDataDto;
    const validDtoObj = {
        code: 'NEW',
        description: 'Actualizado',
        color: '#654321',
        order: 2,
        isActive: true,
        isDefault: false,
        canTransitionTo: ['60f6c2f9b60b5c001c8d4e1a'],
    };

    beforeEach(() => {
        orderStatusRepository = {
            findById: jest.fn(),
            findByCode: jest.fn(),
            update: jest.fn(),
        };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), http: jest.fn() };
        useCase = new UpdateOrderStatusDataUseCase(orderStatusRepository, logger);
        const [err, dto] = UpdateOrderStatusDataDto.update(validDtoObj);
        if (err) throw new Error(err);
        validDto = dto!;
    });

    it('should update order status data', async () => {
        orderStatusRepository.findById.mockResolvedValue({ id: '1', code: 'OLD' });
        orderStatusRepository.findByCode.mockResolvedValue(null);
        orderStatusRepository.update.mockResolvedValue({ id: '1', ...validDtoObj });
        const result = await useCase.execute('1', validDto);
        expect(orderStatusRepository.findById).toHaveBeenCalledWith('1');
        expect(orderStatusRepository.findByCode).toHaveBeenCalledWith('NEW');
        expect(orderStatusRepository.update).toHaveBeenCalledWith('1', validDto);
        expect(result).toEqual({ id: '1', ...validDtoObj });
    });

    it('should throw CustomError if repository throws', async () => {
        orderStatusRepository.findById.mockResolvedValue({ id: '1', code: 'OLD' });
        orderStatusRepository.findByCode.mockResolvedValue(null);
        orderStatusRepository.update.mockRejectedValue(CustomError.internalServerError('fail'));
        await expect(useCase.execute('1', validDto)).rejects.toBeInstanceOf(CustomError);
    });

    it('should throw CustomError if not found', async () => {
        orderStatusRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute('1', validDto)).rejects.toBeInstanceOf(CustomError);
    });

    it('should throw CustomError if code already exists', async () => {
        orderStatusRepository.findById.mockResolvedValue({ id: '1', code: 'OLD' });
        orderStatusRepository.findByCode.mockResolvedValue({ id: '2', code: 'NEW' });
        await expect(useCase.execute('1', validDto)).rejects.toBeInstanceOf(CustomError);
    });
});
