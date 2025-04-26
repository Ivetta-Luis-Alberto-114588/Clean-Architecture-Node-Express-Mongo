// src/domain/use-cases/order/find-order-by-date-range.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";
import logger from "../../../configs/logger"; // Importar logger

// --- INTERFAZ MODIFICADA ---
interface IFindOrderByDateRangeUseCase {
    execute(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>
}
// --- FIN INTERFAZ MODIFICADA ---

export class FindOrderByDateRangeUseCase implements IFindOrderByDateRangeUseCase {
    constructor(
        private readonly orderRepository: OrderRepository
    ) { }

    // --- MÉTODO EXECUTE MODIFICADO ---
    async execute(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        try {
            // Validar que el rango de fechas sea correcto
            if (startDate > endDate) {
                throw CustomError.badRequest("La fecha de inicio debe ser anterior a la fecha de fin");
            }

            // La validación de paginationDto ya se hace en el controller

            // Buscamos las ventas por rango de fechas (el repo ya devuelve la estructura correcta)
            const result = await this.orderRepository.findByDateRange(startDate, endDate, paginationDto);

            return result; // Devolver el objeto { total, orders }

        } catch (error) {
            logger.error("Error en FindOrderByDateRangeUseCase:", { error }); // Usar logger
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Error al buscar pedidos por rango de fechas");
        }
    }
    // --- FIN MÉTODO EXECUTE MODIFICADO ---
}