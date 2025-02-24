import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CustomerEntity } from "../../entities/customers/customer";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface IFindCustomersByNeighborhoodUseCase {
    execute(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]>
}

export class FindCustomersByNeighborhoodUseCase implements IFindCustomersByNeighborhoodUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository
    ){}

    async execute(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]> {
        try {
            // Verificamos que el barrio exista
            await this.neighborhoodRepository.findById(neighborhoodId);
            
            // Si no se proporciona paginación, creamos una por defecto
            if (!paginationDto) {
                const [error, defaultPagination] = PaginationDto.create(1, 5);
                if (error) throw CustomError.badRequest(error);
                paginationDto = defaultPagination!;
            }

            // Buscamos los clientes por barrio
            const customers = await this.customerRepository.findByNeighborhood(neighborhoodId, paginationDto);
            
            return customers;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("find-customers-by-neighborhood-use-case, error interno del servidor");
        }
    }
}