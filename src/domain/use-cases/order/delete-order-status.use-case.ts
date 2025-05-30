// src/domain/use-cases/order/delete-order-status.use-case.ts
import { OrderStatusEntity } from "../../entities/order/order-status.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import logger from "../../../configs/logger";

interface IDeleteOrderStatusUseCase {
    execute(id: string): Promise<OrderStatusEntity>;
}

export class DeleteOrderStatusUseCase implements IDeleteOrderStatusUseCase {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    async execute(id: string): Promise<OrderStatusEntity> {
        try {
            // Verificar que el estado exista
            const existingStatus = await this.orderStatusRepository.findById(id);
            if (!existingStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            // No permitir eliminar el estado por defecto
            if (existingStatus.isDefault) {
                throw CustomError.badRequest('No se puede eliminar el estado por defecto');
            }

            const deletedStatus = await this.orderStatusRepository.delete(id);

            logger.info(`Estado de pedido eliminado exitosamente: ${deletedStatus.code}`);
            return deletedStatus;

        } catch (error) {
            logger.error('Error en DeleteOrderStatusUseCase:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al eliminar estado de pedido');
        }
    }
}
