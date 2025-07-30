import { UpdateOrderStatusTransitionsUseCaseImpl } from '../../../../../src/domain/use-cases/order/update-order-status-transitions.use-case';
import { UpdateOrderStatusTransitionsDto } from '../../../../../src/domain/dtos/order/update-order-status-transitions.dto';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('UpdateOrderStatusTransitionsUseCaseImpl', () => {
    let orderStatusRepository: any;
    let logger: any;
    let useCase: UpdateOrderStatusTransitionsUseCaseImpl;

    beforeEach(() => {
        orderStatusRepository = {
            findById: jest.fn().mockResolvedValue({
                id: '1',
                code: 'NEW',
                name: 'Nuevo',
                description: 'desc',
                color: '#fff',
                order: 1,
                isActive: true,
                isDefault: false,
                canTransitionTo: [],
            }),
            findByCode: jest.fn().mockResolvedValue({ id: '2' }),
            update: jest.fn().mockResolvedValue({ id: '1', canTransitionTo: ['2', '3'] }),
        };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), http: jest.fn() };
        useCase = new UpdateOrderStatusTransitionsUseCaseImpl(orderStatusRepository, logger);
    });

    it('should update order status transitions', async () => {
        const [err, dto] = UpdateOrderStatusTransitionsDto.create({ canTransitionTo: ['2', '3'] });
        expect(err).toBeUndefined();
        const result = await useCase.execute('1', dto!);
        expect(orderStatusRepository.findById).toHaveBeenCalledWith('1');
        expect(orderStatusRepository.findByCode).toHaveBeenCalledWith('2');
        expect(orderStatusRepository.findByCode).toHaveBeenCalledWith('3');
        expect(orderStatusRepository.update).toHaveBeenCalled();
        expect(result).toEqual({ id: '1', canTransitionTo: ['2', '3'] });
    });

    it('should throw CustomError if repository throws', async () => {
        orderStatusRepository.findById.mockRejectedValue(CustomError.internalServerError('fail'));
        const [err, dto] = UpdateOrderStatusTransitionsDto.create({ canTransitionTo: ['2', '3'] });
        expect(err).toBeUndefined();
        await expect(useCase.execute('1', dto!)).rejects.toBeInstanceOf(CustomError);
    });
});
