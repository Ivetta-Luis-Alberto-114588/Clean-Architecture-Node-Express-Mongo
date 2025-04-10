// src/domain/use-cases/customers/update-address.use-case.ts
import { UpdateAddressDto } from "../../dtos/customers/update-address.dto";
import { AddressEntity } from "../../entities/customers/address.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../repositories/customers/neighborhood.repository";
import logger from "../../../configs/logger";

interface IUpdateAddressUseCase {
    execute(userId: string, addressId: string, props: { [key: string]: any }): Promise<AddressEntity>;
}

export class UpdateAddressUseCase implements IUpdateAddressUseCase {
    constructor(
        private readonly customerRepository: CustomerRepository,
        private readonly neighborhoodRepository: NeighborhoodRepository
    ) { }

    async execute(userId: string, addressId: string, props: { [key: string]: any }): Promise<AddressEntity> {
        // 1. Obtener Customer ID del User ID
        const customer = await this.customerRepository.findByUserId(userId);
        if (!customer) throw CustomError.unauthorized("Perfil de cliente no encontrado.");
        const customerId = customer.id.toString();
        logger.debug(`[UpdateAddressUC] Cliente ${customerId} encontrado para User ${userId}`);

        // 2. Validar DTO de actualización
        const [error, updateAddressDto] = UpdateAddressDto.create(props);
        if (error) throw CustomError.badRequest(error);

        // 3. Validar nuevo barrio si se proporciona
        if (updateAddressDto!.neighborhoodId) {
            try {
                await this.neighborhoodRepository.findById(updateAddressDto!.neighborhoodId);
                logger.debug(`[UpdateAddressUC] Nuevo barrio ${updateAddressDto!.neighborhoodId} validado.`);
            } catch (neighborhoodError) {
                logger.warn(`[UpdateAddressUC] Error buscando nuevo barrio ${updateAddressDto!.neighborhoodId}:`, { neighborhoodError });
                if (neighborhoodError instanceof CustomError && neighborhoodError.statusCode === 404) {
                    throw CustomError.badRequest(`El nuevo barrio (ID: ${updateAddressDto!.neighborhoodId}) no existe.`);
                }
                throw neighborhoodError;
            }
        }
        // Nota: Podrías añadir validación similar para cityId si permites cambiarlo explícitamente.

        // 4. Verificar propiedad ANTES de llamar al repositorio
        const existingAddress = await this.customerRepository.findAddressById(addressId);
        if (!existingAddress) throw CustomError.notFound(`Dirección con ID ${addressId} no encontrada.`);
        if (existingAddress.customerId !== customerId) {
            logger.warn(`[UpdateAddressUC] Intento fallido: User ${userId} (Cliente ${customerId}) intentó modificar dirección ${addressId} que pertenece a Cliente ${existingAddress.customerId}`);
            throw CustomError.forbiden("No tienes permiso para modificar esta dirección.");
        }

        // 5. Llamar al repositorio para actualizar
        try {
            // El datasource se encarga de la lógica de isDefault y de obtener la ciudad del barrio si es necesario
            const updatedAddress = await this.customerRepository.updateAddress(addressId, updateAddressDto!);
            if (!updatedAddress) {
                // Esto podría ocurrir si la dirección se eliminó entre la verificación y la actualización
                logger.error(`[UpdateAddressUC] Dirección ${addressId} no encontrada durante el proceso de actualización para cliente ${customerId}.`);
                throw CustomError.notFound("Dirección no encontrada durante la actualización.");
            }
            logger.info(`[UpdateAddressUC] Dirección actualizada ${addressId} para cliente ${customerId}`);
            return updatedAddress;
        } catch (repoError) {
            logger.error(`[UpdateAddressUC] Error actualizando dirección ${addressId} en repo para cliente ${customerId}:`, { repoError });
            if (repoError instanceof CustomError) throw repoError;
            throw CustomError.internalServerError("Error al actualizar la dirección.");
        }
    }
}