import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CustomerEntity } from "../../entities/customers/customer";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";

interface IGetAllCustomersUseCase {
    execute(paginationDto: PaginationDto): Promise<CustomerEntity[]>
}

export class GetAllCustomersUseCase implements IGetAllCustomersUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository
    ){}

    async execute(paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        try {
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Obtenemos todos los clientes
            const customers = await this.customerRepository.getAll(paginationDto!);

            // Devolvemos los clientes
            return customers;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("get-all-customers-use-case, error interno del servidor");
        }
    }
}