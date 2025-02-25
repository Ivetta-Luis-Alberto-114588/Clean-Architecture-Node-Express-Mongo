import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { SaleRepository } from "../../repositories/sales/sale.repository";

interface IFindSalesByCustomerUseCase {
    execute(customerId: string, paginationDto: PaginationDto): Promise<SaleEntity[]>
}

export class FindSalesByCustomerUseCase implements IFindSalesByCustomerUseCase {
    constructor(
        private readonly saleRepository: SaleRepository,
        private readonly customerRepository: CustomerRepository
    ){}

    async execute(customerId: string, paginationDto: PaginationDto): Promise<SaleEntity[]> {
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
            const sales = await this.saleRepository.findByCustomer(customerId, paginationDto);
            
            return sales;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("find-sales-by-customer-use-case, error interno del servidor");
        }
    }
}