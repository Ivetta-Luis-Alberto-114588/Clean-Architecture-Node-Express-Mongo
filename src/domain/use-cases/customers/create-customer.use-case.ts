import { CreateCustomerDto } from "../../dtos/customers/create-customer.dto";
import { CustomerEntity } from "../../entities/customers/customer";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";
import { GuestEmailUtil } from "../../utils/guest-email.util";

interface ICreateCustomerUseCase {
    execute(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity>;
}

export class CreateCustomerUseCase implements ICreateCustomerUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository
    ) { }

    async execute(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity> {
        try {
            // Validaciones de negocio
            if (createCustomerDto.name.length < 3) {
                throw CustomError.badRequest("El nombre del cliente debe tener al menos 3 caracteres");
            }

            // Verificar que el barrio exista
            await this.neighborhoodRepository.findById(createCustomerDto.neighborhoodId);

            // Verificar si el email ya está registrado (solo para emails que no son de invitados)
            if (!GuestEmailUtil.isGuestEmail(createCustomerDto.email)) {
                const existingCustomer = await this.customerRepository.findByEmail(createCustomerDto.email);
                if (existingCustomer) {
                    throw CustomError.badRequest("Ya existe un cliente con este email");
                }
            }

            // Crear el cliente
            return await this.customerRepository.create(createCustomerDto);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("create-customer-use-case, error interno del servidor");
        }
    }
}