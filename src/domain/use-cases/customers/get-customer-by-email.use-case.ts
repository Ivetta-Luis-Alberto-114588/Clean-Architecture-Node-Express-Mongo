import { CustomerEntity } from "../../entities/customers/customer";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";

interface IGetCustomerByEmailUseCase {
    execute(email: string): Promise<CustomerEntity | null>
}

export class GetCustomerByEmailUseCase implements IGetCustomerByEmailUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository
    ) {}

    async execute(email: string): Promise<CustomerEntity | null> {
        try {
            // Validamos el formato del email
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!emailRegex.test(email)) {
                throw CustomError.badRequest("Formato de email inválido");
            }
            
            // Buscamos el cliente por email
            const customer = await this.customerRepository.findByEmail(email);
            
            // Devolvemos el cliente (o null si no existe)
            return customer;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-customer-by-email-use-case error');
        }
    }
}