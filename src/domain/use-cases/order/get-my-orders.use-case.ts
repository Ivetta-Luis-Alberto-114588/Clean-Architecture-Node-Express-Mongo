// src/domain/use-cases/order/get-my-orders.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { OrderRepository } from "../../repositories/order/order.repository";
import logger from "../../../configs/logger";

interface IGetMyOrdersUseCase {
    execute(userId: string, paginationDto: PaginationDto): Promise<OrderEntity[]>
}

export class GetMyOrdersUseCase implements IGetMyOrdersUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository // Necesario para encontrar el CustomerId
    ) { }

    async execute(userId: string, paginationDto: PaginationDto): Promise<OrderEntity[]> {
        logger.info(`Iniciando GetMyOrdersUseCase para userId: ${userId}`);

        try {
            // 1. Encontrar el perfil de cliente asociado al usuario autenticado
            const customer = await this.customerRepository.findByUserId(userId);

            if (!customer) {
                // Esto indica una inconsistencia si el usuario está autenticado pero no tiene cliente
                logger.error(`¡INCONSISTENCIA! No se encontró Customer para User ID: ${userId}`);
                throw CustomError.internalServerError('No se pudo encontrar el perfil de cliente asociado a este usuario. Contacte a soporte.');
                // O podrías devolver un array vacío si prefieres:
                // logger.warn(`No se encontró Customer para User ID: ${userId}, devolviendo historial vacío.`);
                // return [];
            }

            const customerId = customer.id.toString();
            logger.debug(`Cliente encontrado (ID: ${customerId}) para User ID: ${userId}`);

            // 2. Usar el customerId para encontrar sus pedidos usando el método existente
            //    del repositorio de pedidos.
            const orders = await this.orderRepository.findByCustomer(customerId, paginationDto);

            logger.info(`Pedidos encontrados para cliente ${customerId} (Usuario ${userId}): ${orders.length}`);
            return orders;

        } catch (error) {
            logger.error(`Error en GetMyOrdersUseCase para userId ${userId}:`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Error al obtener el historial de pedidos.");
        }
    }
}