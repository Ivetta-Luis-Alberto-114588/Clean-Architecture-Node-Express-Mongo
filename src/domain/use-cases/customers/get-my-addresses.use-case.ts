// src/domain/use-cases/customers/get-my-addresses.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { AddressEntity } from "../../entities/customers/address.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import logger from "../../../configs/logger";

interface IGetMyAddressesUseCase {
    execute(userId: string, paginationDto: PaginationDto): Promise<AddressEntity[]>;
}

export class GetMyAddressesUseCase implements IGetMyAddressesUseCase {
    constructor(private readonly customerRepository: CustomerRepository) { }

    async execute(userId: string, paginationDto: PaginationDto): Promise<AddressEntity[]> {
        // 1. Obtener Customer ID del User ID
        const customer = await this.customerRepository.findByUserId(userId);
        if (!customer) {
            // Si un usuario autenticado no tiene perfil, es un error interno o de flujo
            logger.error(`[GetMyAddressesUC] Perfil de cliente no encontrado para usuario autenticado ${userId}`);
            throw CustomError.unauthorized("Perfil de cliente no encontrado para este usuario.");
            // Alternativamente, podrías devolver un array vacío si consideras que es un estado válido
            // logger.warn(`[GetMyAddressesUC] Perfil de cliente no encontrado para usuario ${userId}, devolviendo lista vacía.`);
            // return [];
        }
        const customerId = customer.id.toString();
        logger.debug(`[GetMyAddressesUC] Cliente ${customerId} encontrado para User ${userId}`);


        // 2. Llamar al repositorio para obtener las direcciones
        try {
            const addresses = await this.customerRepository.getAddressesByCustomerId(customerId, paginationDto);
            logger.info(`[GetMyAddressesUC] Obtenidas ${addresses.length} direcciones para cliente ${customerId}`);
            return addresses;
        } catch (repoError) {
            logger.error(`[GetMyAddressesUC] Error obteniendo direcciones del repositorio para cliente ${customerId}:`, { repoError });
            if (repoError instanceof CustomError) throw repoError;
            throw CustomError.internalServerError("Error al obtener las direcciones.");
        }
    }
}