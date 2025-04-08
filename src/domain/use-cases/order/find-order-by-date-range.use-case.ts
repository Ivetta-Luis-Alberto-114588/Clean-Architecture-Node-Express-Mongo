import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IFindOrderByDateRangeUseCase {
    execute(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]>
}

export class FindOrderByDateRangeUseCase implements IFindOrderByDateRangeUseCase {
    constructor(
        private readonly orderRepository: OrderRepository
    ) { }

    async execute(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]> {
        try {
            // Validar que el rango de fechas sea correcto
            if (startDate > endDate) {
                throw CustomError.badRequest("La fecha de inicio debe ser anterior a la fecha de fin");
            }

            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 10);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Buscamos las ventas por rango de fechas
            const orders = await this.orderRepository.findByDateRange(startDate, endDate, paginationDto);

            return orders;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("find-sales-by-date-range-use-case, error interno del servidor");
        }
    }
}