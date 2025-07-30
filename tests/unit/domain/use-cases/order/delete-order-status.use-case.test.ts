import { DeleteOrderStatusUseCase } from '../../../../../src/domain/use-cases/order/delete-order-status.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';

describe('DeleteOrderStatusUseCase', () => {
    let orderStatusRepository: any;
    let useCase: DeleteOrderStatusUseCase;

    beforeEach(() => {
        orderStatusRepository = {
            delete: jest.fn(),
            findById: jest.fn(),
        };
        useCase = new DeleteOrderStatusUseCase(orderStatusRepository);
    });

    it('should delete order status if exists', async () => {
        orderStatusRepository.findById.mockResolvedValue({ id: '1', name: 'Nuevo' });
        orderStatusRepository.delete.mockResolvedValue(true);
        const result = await useCase.execute('1');
        expect(orderStatusRepository.findById).toHaveBeenCalledWith('1');
        expect(orderStatusRepository.delete).toHaveBeenCalledWith('1');
        expect(result).toBe(true);
    });

    it('should throw CustomError if not found', async () => {
        orderStatusRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute('1')).rejects.toBeInstanceOf(CustomError);
    });

    it('should throw CustomError if repository throws', async () => {
        orderStatusRepository.findById.mockResolvedValue({ id: '1', name: 'Nuevo' });
        orderStatusRepository.delete.mockRejectedValue(CustomError.internalServerError('fail'));
        await expect(useCase.execute('1')).rejects.toBeInstanceOf(CustomError);
    });
});
