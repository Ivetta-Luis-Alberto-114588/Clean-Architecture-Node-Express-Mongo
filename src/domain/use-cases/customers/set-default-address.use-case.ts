// src/domain/use-cases/customers/set-default-address.use-case.ts
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import logger from "../../../configs/logger";

interface ISetDefaultAddressUseCase {
    execute(userId: string, addressId: string): Promise<{ success: boolean }>;
}

export class SetDefaultAddressUseCase implements ISetDefaultAddressUseCase {
    constructor(private readonly customerRepository: CustomerRepository) { }

    async execute(userId: string, addressId: string): Promise<{ success: boolean }> {
        // 1. Obtener Customer ID del User ID
        const customer = await this.customerRepository.findByUserId(userId);
        if (!customer) throw CustomError.unauthorized("Perfil de cliente no encontrado.");
        const customerId = customer.id.toString();
        logger.debug(`[SetDefaultAddressUC] Cliente ${customerId} encontrado para User ${userId}`);

        // 2. Verificar que la dirección a marcar como default existe y pertenece al cliente
        //    (El repositorio también lo hará, pero es una buena práctica aquí)
        const addressToSet = await this.customerRepository.findAddressById(addressId);
        if (!addressToSet) throw CustomError.notFound(`Dirección con ID ${addressId} no encontrada.`);
        if (addressToSet.customerId !== customerId) {
            logger.warn(`[SetDefaultAddressUC] Intento fallido: User ${userId} (Cliente ${customerId}) intentó setear default dirección ${addressId} que pertenece a Cliente ${addressToSet.customerId}`);
            throw CustomError.forbiden("No tienes permiso para modificar esta dirección.");
        }
        // Si ya es default, podríamos devolver éxito directamente
        if (addressToSet.isDefault) {
            logger.info(`[SetDefaultAddressUC] Dirección ${addressId} ya es la predeterminada.`);
            return { success: true };
        }


        // 3. Llamar al repositorio (que maneja la lógica de desmarcar la anterior)
        try {
            const success = await this.customerRepository.setDefaultAddress(addressId, customerId);
            if (success) {
                logger.info(`[SetDefaultAddressUC] Dirección ${addressId} marcada como default para cliente ${customerId}`);
                return { success: true };
            } else {
                // Esto indica un problema inesperado en el repositorio/datasource
                logger.error(`[SetDefaultAddressUC] setDefaultAddress del repositorio devolvió false para Addr ${addressId}, Cust ${customerId}.`);
                throw CustomError.internalServerError("No se pudo marcar la dirección como predeterminada.");
            }

        } catch (repoError) {
            logger.error(`[SetDefaultAddressUC] Error seteando default ${addressId} en repo para cliente ${customerId}:`, { repoError });
            if (repoError instanceof CustomError) throw repoError;
            throw CustomError.internalServerError("Error al marcar dirección como predeterminada.");
        }
    }
}