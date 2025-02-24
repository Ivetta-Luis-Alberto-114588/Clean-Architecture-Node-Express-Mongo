import { CustomerEntity } from "../../entities/customers/customer";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";

interface IGetCustomerByIdUseCase {
    execute(id: string): Promise<CustomerEntity>
}

export class GetCustomerByIdUseCase implements IGetCustomerByIdUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository
    ) {}

    async execute(id: string): Promise<CustomerEntity> {
        try {
            // Buscamos el cliente por ID
            const customer = await this.customerRepository.findById(id);
            
            // Si no existe, lanzamos un error
            if (!customer) {
                throw CustomError.notFound('Cliente no encontrado');
            }

            return customer;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-customer-by-id-use-case error');
        }
    }
}