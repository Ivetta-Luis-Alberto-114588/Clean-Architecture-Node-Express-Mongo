// src/domain/use-cases/order/find-order-by-customer.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { OrderRepository } from "../../repositories/order/order.repository";
import logger from "../../../configs/logger"; // Importar logger

// --- INTERFAZ MODIFICADA ---
interface IFindOrderByCustomerUseCase {
    execute(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>
}
// --- FIN INTERFAZ MODIFICADA ---

export class FindOrderByCustomerUseCase implements IFindOrderByCustomerUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository
    ) { }

    // --- MÉTODO EXECUTE MODIFICADO ---
    async execute(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        try {
            // Verificamos que el cliente exista (buena práctica, aunque el repo también podría hacerlo)
            await this.customerRepository.findById(customerId);

            // La validación de paginationDto ya se hace en el controller

            // Buscamos las ventas por cliente (el repo ya devuelve la estructura correcta)
            const result = await this.orderRepository.findByCustomer(customerId, paginationDto);

            return result; // Devolver el objeto { total, orders }

        } catch (error) {
            logger.error(`Error en FindOrderByCustomerUseCase (Cliente: ${customerId}):`, { error }); // Usar logger
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Error al buscar pedidos por cliente");
        }
    }
    // --- FIN MÉTODO EXECUTE MODIFICADO ---
}