
import { UpdateOrderStatusUseCase } from '../../../../../src/domain/use-cases/order/update-order-status.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { UpdateOrderStatusDto } from '../../../../../src/domain/dtos/order/update-order-status.dto';


describe('UpdateOrderStatusUseCase', () => {
    let orderRepository: any;
    let orderStatusRepository: any;
    let useCase: UpdateOrderStatusUseCase;

    beforeEach(() => {
        orderRepository = {
            findById: jest.fn(),
            updateStatus: jest.fn(),
        };
        orderStatusRepository = {
            findById: jest.fn(),
            validateTransition: jest.fn().mockResolvedValue(true),
        };
        useCase = new UpdateOrderStatusUseCase(orderRepository, orderStatusRepository);
    });


    it('should update order status', async () => {
        const orderId = 'orderId1';
        const statusId = '507f1f77bcf86cd799439011';
        const [err, dto] = UpdateOrderStatusDto.update({ statusId });
        expect(err).toBeUndefined();
        orderRepository.findById.mockResolvedValue({
            id: orderId,
            status: { id: 'statusId1', name: 'Anterior' },
        });
        orderStatusRepository.findById.mockResolvedValue({
            id: statusId,
            isActive: true,
            name: 'Nuevo',
        });
        orderRepository.updateStatus.mockResolvedValue({
            id: orderId,
            status: { id: statusId, name: 'Nuevo' },
        });
        await expect(useCase.execute(orderId, dto!)).resolves.toBeDefined();
        expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
        expect(orderStatusRepository.findById).toHaveBeenCalledWith(statusId);
        expect(orderRepository.updateStatus).toHaveBeenCalledWith(orderId, dto!);
        expect(orderStatusRepository.validateTransition).toHaveBeenCalledWith('statusId1', statusId);
    });


    it('should throw CustomError if order not found', async () => {
        const orderId = 'orderId1';
        const statusId = '507f1f77bcf86cd799439011';
        const [err, dto] = UpdateOrderStatusDto.update({ statusId });
        expect(err).toBeUndefined();
        orderRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute(orderId, dto!)).rejects.toThrow('Pedido no encontrado');
    });

    it('should throw CustomError if status not found', async () => {
        const orderId = 'orderId1';
        const statusId = '507f1f77bcf86cd799439011';
        const [err, dto] = UpdateOrderStatusDto.update({ statusId });
        expect(err).toBeUndefined();
        orderRepository.findById.mockResolvedValue({ id: orderId, status: { id: 'statusId1' } });
        orderStatusRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute(orderId, dto!)).rejects.toThrow('Estado de pedido no encontrado');
    });

    it('should throw CustomError if status is not active', async () => {
        const orderId = 'orderId1';
        const statusId = '507f1f77bcf86cd799439011';
        const [err, dto] = UpdateOrderStatusDto.update({ statusId });
        expect(err).toBeUndefined();
        orderRepository.findById.mockResolvedValue({ id: orderId, status: { id: 'statusId1' } });
        orderStatusRepository.findById.mockResolvedValue({ id: statusId, isActive: false, name: 'Inactivo' });
        await expect(useCase.execute(orderId, dto!)).rejects.toThrow('No se puede cambiar a un estado inactivo');
    });

    it('should throw CustomError if order already has the status', async () => {
        const orderId = 'orderId1';
        const statusId = '507f1f77bcf86cd799439011';
        const [err, dto] = UpdateOrderStatusDto.update({ statusId });
        expect(err).toBeUndefined();
        orderRepository.findById.mockResolvedValue({ id: orderId, status: { id: statusId } });
        orderStatusRepository.findById.mockResolvedValue({ id: statusId, isActive: true, name: 'Nuevo' });
        await expect(useCase.execute(orderId, dto!)).rejects.toThrow("El pedido ya tiene el estado 'Nuevo'");
    });
});
