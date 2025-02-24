import { UpdateCustomerDto } from "../../dtos/customers/update-customer.dto";
import { CustomerEntity } from "../../entities/customers/customer";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";

interface IUpdateCustomerUseCase {
    execute(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity>
}

export class UpdateCustomerUseCase implements IUpdateCustomerUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository
    ){}

    async execute(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerEntity> {
        try {
            // Verificamos que el cliente exista
            const existingCustomer = await this.customerRepository.findById(id);
            if (!existingCustomer) {
                throw CustomError.notFound('update-customer-use-case, Cliente no encontrado');
            }

            // Si se proporciona un nuevo neighborhoodId, verificamos que el barrio exista
            if (updateCustomerDto.neighborhoodId) {
                await this.neighborhoodRepository.findById(updateCustomerDto.neighborhoodId);
            }

            // Si se proporciona un nuevo email, verificamos que no esté en uso por otro cliente
            if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
                const customerWithEmail = await this.customerRepository.findByEmail(updateCustomerDto.email);
                if (customerWithEmail && customerWithEmail.id !== existingCustomer.id) {
                    throw CustomError.badRequest('update-customer-use-case, El email ya está en uso por otro cliente');
                }
            }

            // Si el cliente existe, procedemos a actualizarlo
            const updatedCustomer = await this.customerRepository.update(id, updateCustomerDto);
            return updatedCustomer;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-customer-use-case, error interno del servidor');
        }
    }
}