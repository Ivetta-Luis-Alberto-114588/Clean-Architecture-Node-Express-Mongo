import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { SaleRepository } from "../../repositories/sales/sale.repository";

interface IGetAllSalesUseCase {
    execute(paginationDto: PaginationDto): Promise<OrderEntity[]>
}

export class GetAllSalesUseCase implements IGetAllSalesUseCase {
    constructor(
        private readonly saleRepository: SaleRepository
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
            const sales = await this.saleRepository.getAll(paginationDto);

            // Devolvemos las ventas
            return sales;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-all-sales-use-case, error interno del servidor");
        }
    }
}