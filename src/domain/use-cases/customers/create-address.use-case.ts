// src/domain/use-cases/customers/create-address.use-case.ts
import { CreateAddressDto } from "../../dtos/customers/create-address.dto";
import { AddressEntity } from "../../entities/customers/address.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository"; // <<<--- Necesario para validar
import logger from "../../../configs/logger";

interface ICreateAddressUseCase {
    execute(userId: string, props: { [key: string]: any }): Promise<AddressEntity>;
}

export class CreateAddressUseCase implements ICreateAddressUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository // <<<--- Inyectar
    ) { }

    async execute(userId: string, props: { [key: string]: any }): Promise<AddressEntity> {
        // 1. Obtener Customer ID del User ID
        const customer = await this.customerRepository.findByUserId(userId);
        if (!customer) {
            throw CustomError.unauthorized("Perfil de cliente no encontrado para este usuario.");
        }
        const customerId = customer.id.toString();
        logger.debug(`[CreateAddressUC] Cliente ${customerId} encontrado para User ${userId}`);

        // 2. Validar/Crear DTO pasándole el customerId obtenido
        const [error, createAddressDto] = CreateAddressDto.create(props, customerId);
        if (error) throw CustomError.badRequest(error);

        // 3. Validar explícitamente que el barrio existe (mejora el feedback)
        try {
            // Usar neighborhoodId del DTO ya validado
            await this.neighborhoodRepository.findById(createAddressDto!.neighborhoodId!);
            logger.debug(`[CreateAddressUC] Barrio ${createAddressDto!.neighborhoodId} validado.`);
        } catch (neighborhoodError) {
            logger.warn(`[CreateAddressUC] Error buscando barrio ${createAddressDto!.neighborhoodId}:`, { neighborhoodError });
            if (neighborhoodError instanceof CustomError && neighborhoodError.statusCode === 404) {
                throw CustomError.badRequest(`El barrio seleccionado (ID: ${createAddressDto!.neighborhoodId}) no existe.`);
            }
            throw neighborhoodError; // Re-lanzar otros errores
        }

        // 4. Llamar al repositorio para crear la dirección
        try {
            const address = await this.customerRepository.createAddress(createAddressDto!);
            logger.info(`[CreateAddressUC] Dirección creada ${address.id} para cliente ${customerId}`);
            return address;
        } catch (repoError) {
            logger.error(`[CreateAddressUC] Error creando dirección en repositorio para cliente ${customerId}:`, { repoError });
            if (repoError instanceof CustomError) throw repoError;
            throw CustomError.internalServerError("Error al guardar la dirección.");
        }
    }
}