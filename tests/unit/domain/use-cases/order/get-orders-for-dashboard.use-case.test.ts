import { GetOrdersForDashboardUseCase } from '../../../../../src/domain/use-cases/order/get-orders-for-dashboard.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';


describe('GetOrdersForDashboardUseCase', () => {
    let orderRepository: any;
    let orderStatusRepository: any;
    let useCase: GetOrdersForDashboardUseCase;

    beforeEach(() => {
        orderRepository = {
            getAll: jest.fn().mockResolvedValue({ orders: [{ id: '1', status: { id: 'status1' } }, { id: '2', status: { id: 'status2' } }], total: 2 }),
        };
        orderStatusRepository = {
            getAll: jest.fn().mockResolvedValue({
                orderStatuses: [
                    { id: 'status1', order: 1, name: 'Status 1' },
                    { id: 'status2', order: 2, name: 'Status 2' }
                ]
            }),
        };
        useCase = new GetOrdersForDashboardUseCase(orderRepository, orderStatusRepository);
    });


    it('should return grouped dashboard orders', async () => {
        const result = await useCase.execute();
        expect(orderStatusRepository.getAll).toHaveBeenCalled();
        expect(orderRepository.getAll).toHaveBeenCalled();
        expect(result.length).toBe(2);
        expect(result[0].status.id).toBe('status1');
        expect(result[1].status.id).toBe('status2');
        expect(Array.isArray(result[0].orders)).toBe(true);
    });

    it('should throw CustomError if orderStatusRepository throws', async () => {
        orderStatusRepository.getAll.mockRejectedValue(CustomError.internalServerError('fail'));
        await expect(useCase.execute()).rejects.toBeInstanceOf(CustomError);
    });
});
