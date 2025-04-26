// src/domain/use-cases/order/get-all-order.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";
import logger from "../../../configs/logger"; // Importar logger

// --- INTERFAZ MODIFICADA ---
interface IGetAllOrderUseCase {
    execute(paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>
}
// --- FIN INTERFAZ MODIFICADA ---

export class GetAllOrderUseCase implements IGetAllOrderUseCase {
    constructor(
        private readonly orderRepository: OrderRepository
    ) { }

    // --- MÉTODO EXECUTE MODIFICADO ---
    async execute(paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        try {
            // La validación de paginationDto ya se hace en el controller

            // Obtenemos el objeto { total, orders } del repositorio
            const result = await this.orderRepository.getAll(paginationDto);

            // Devolvemos el objeto completo
            return result;
        } catch (error) {
            logger.error("Error en GetAllOrderUseCase:", { error }); // Usar logger
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Error al obtener todas las ventas");
        }
    }
    // --- FIN MÉTODO EXECUTE MODIFICADO ---
}