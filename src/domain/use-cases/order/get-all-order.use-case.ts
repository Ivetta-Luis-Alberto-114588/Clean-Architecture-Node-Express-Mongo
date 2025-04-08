import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IGetAllOrderUseCase {
    execute(paginationDto: PaginationDto): Promise<OrderEntity[]>
}

export class GetAllOrderUseCase implements IGetAllOrderUseCase {
    constructor(
        private readonly orderRepository: OrderRepository
    ) { }

    async execute(paginationDto: PaginationDto): Promise<OrderEntity[]> {
        try {
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 10);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Obtenemos todas las ventas
            const orders = await this.orderRepository.getAll(paginationDto);

            // Devolvemos las ventas
            return orders;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-all-sales-use-case, error interno del servidor");
        }
    }
}