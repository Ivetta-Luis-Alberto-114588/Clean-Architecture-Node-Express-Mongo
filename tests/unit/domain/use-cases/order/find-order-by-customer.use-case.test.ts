
import { FindOrderByCustomerUseCase } from '../../../../../src/domain/use-cases/order/find-order-by-customer.use-case';
import { CustomError } from '../../../../../src/domain/errors/custom.error';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';

describe('FindOrderByCustomerUseCase', () => {
    let orderRepository: any;
    let customerRepository: any;
    let useCase: FindOrderByCustomerUseCase;
    let paginationDto: PaginationDto;

    beforeEach(() => {
        orderRepository = {
            findByCustomer: jest.fn(),
        };
        customerRepository = {
            findById: jest.fn().mockResolvedValue({ id: 'customer1', name: 'Test Customer' }),
        };
        useCase = new FindOrderByCustomerUseCase(orderRepository, customerRepository);
        // Use valid PaginationDto
        const [err, dto] = PaginationDto.create(1, 10);
        if (err) throw new Error(err);
        paginationDto = dto!;
    });

    it('should return orders for customer', async () => {
        const orders = { total: 2, orders: [{ id: '1' }, { id: '2' }] };
        orderRepository.findByCustomer.mockResolvedValue(orders);
        const result = await useCase.execute('customer1', paginationDto);
        expect(customerRepository.findById).toHaveBeenCalledWith('customer1');
        expect(orderRepository.findByCustomer).toHaveBeenCalledWith('customer1', paginationDto);
        expect(result).toEqual(orders);
    });

    it('should throw CustomError if repository throws', async () => {
        orderRepository.findByCustomer.mockRejectedValue(CustomError.internalServerError('fail'));
        await expect(useCase.execute('customer1', paginationDto)).rejects.toBeInstanceOf(CustomError);
    });
});
