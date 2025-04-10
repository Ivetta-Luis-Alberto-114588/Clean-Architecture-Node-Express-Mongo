// src/domain/use-cases/customers/delete-address.use-case.ts
import { AddressEntity } from "../../entities/customers/address.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import logger from "../../../configs/logger";

interface IDeleteAddressUseCase {
    execute(userId: string, addressId: string): Promise<AddressEntity>; // Devolver la entidad eliminada
}

export class DeleteAddressUseCase implements IDeleteAddressUseCase {
    constructor(private readonly customerRepository: CustomerRepository) { }

    async execute(userId: string, addressId: string): Promise<AddressEntity> {
        // 1. Obtener Customer ID del User ID
        const customer = await this.customerRepository.findByUserId(userId);
        if (!customer) throw CustomError.unauthorized("Perfil de cliente no encontrado.");
        const customerId = customer.id.toString();
        logger.debug(`[DeleteAddressUC] Cliente ${customerId} encontrado para User ${userId}`);

        // 2. Llamar al repositorio (que ya verifica propiedad)
        try {
            const deletedAddress = await this.customerRepository.deleteAddress(addressId, customerId);
            if (!deletedAddress) {
                // Esto podría pasar si el ID es válido pero no pertenece al cliente,
                // o si el ID es inválido y el datasource devolvió null en lugar de lanzar error.
                // El datasource ya debería haber lanzado NotFound o Forbidden.
                logger.error(`[DeleteAddressUC] deleteAddress del repositorio devolvió null para Addr ${addressId}, Cust ${customerId}.`);
                throw CustomError.notFound("No se pudo eliminar la dirección (no encontrada o sin permisos).");
            }
            logger.info(`[DeleteAddressUC] Dirección eliminada ${addressId} para cliente ${customerId}`);
            return deletedAddress; // Devolver la entidad eliminada
        } catch (repoError) {
            logger.error(`[DeleteAddressUC] Error eliminando dirección ${addressId} en repo para cliente ${customerId}:`, { repoError });
            if (repoError instanceof CustomError) throw repoError;
            throw CustomError.internalServerError("Error al eliminar la dirección.");
        }
    }
}