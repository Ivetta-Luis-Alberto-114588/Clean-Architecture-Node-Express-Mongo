import { CustomerEntity } from "../../entities/customers/customer";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";

interface IDeleteCustomerUseCase {
    execute(id: string): Promise<CustomerEntity>    
}

export class DeleteCustomerUseCase implements IDeleteCustomerUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository
    ){}

    async execute(id: string): Promise<CustomerEntity> {
        try {
            // Buscamos el cliente
            const customer = await this.customerRepository.findById(id);

            // Si no existe lanzamos un error
            if (!customer) {
                throw CustomError.notFound("delete-customer-use-case, cliente no encontrado");
            }

            // Eliminamos el cliente y lo guardamos en deletedCustomer
            const deletedCustomer = await this.customerRepository.delete(id);
            
            return deletedCustomer;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("delete-customer-use-case, error interno del servidor");            
        }
    }
}