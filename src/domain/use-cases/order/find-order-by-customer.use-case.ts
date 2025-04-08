import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IFindOrderByCustomerUseCase {
    execute(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]>
}

export class FindOrderByCustomerUseCase implements IFindOrderByCustomerUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository
    ) { }

    async execute(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]> {
        try {
            // Verificamos que el cliente exista
            await this.customerRepository.findById(customerId);

            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 10);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Buscamos las ventas por cliente
            const sales = await this.orderRepository.findByCustomer(customerId, paginationDto);

            return sales;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("find-sales-by-customer-use-case, error interno del servidor");
        }
    }
}