// src/domain/use-cases/order/get-my-orders.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { OrderRepository } from "../../repositories/order/order.repository";
import logger from "../../../configs/logger";

// --- INTERFAZ MODIFICADA ---
interface IGetMyOrdersUseCase {
    execute(userId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>
}
// --- FIN INTERFAZ MODIFICADA ---

export class GetMyOrdersUseCase implements IGetMyOrdersUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository
    ) { }

    // --- MÉTODO EXECUTE MODIFICADO ---
    async execute(userId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        logger.info(`Iniciando GetMyOrdersUseCase para userId: ${userId}`);

        try {
            const customer = await this.customerRepository.findByUserId(userId);

            if (!customer) {
                logger.error(`¡INCONSISTENCIA! No se encontró Customer para User ID: ${userId}`);
                // Devolver estructura vacía en lugar de lanzar error 500
                return { total: 0, orders: [] };
                // throw CustomError.internalServerError('No se pudo encontrar el perfil de cliente asociado.');
            }

            const customerId = customer.id.toString();
            logger.debug(`Cliente encontrado (ID: ${customerId}) para User ID: ${userId}`);

            // El repositorio ya devuelve la estructura correcta
            const result = await this.orderRepository.findByCustomer(customerId, paginationDto);

            logger.info(`Pedidos encontrados para cliente ${customerId} (Usuario ${userId}): ${result.total}`);
            return result; // Devolver el objeto { total, orders }

        } catch (error) {
            logger.error(`Error en GetMyOrdersUseCase para userId ${userId}:`, { error });
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Error al obtener el historial de pedidos.");
        }
    }
    // --- FIN MÉTODO EXECUTE MODIFICADO ---
}