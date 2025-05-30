// src/domain/use-cases/order/update-order-status-data.use-case.ts
import { UpdateOrderStatusDataDto } from "../../dtos/order/update-order-status-data.dto";
import { OrderStatusEntity } from "../../entities/order/order-status.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import logger from "../../../configs/logger";

interface IUpdateOrderStatusDataUseCase {
    execute(id: string, updateOrderStatusDataDto: UpdateOrderStatusDataDto): Promise<OrderStatusEntity>;
}

export class UpdateOrderStatusDataUseCase implements IUpdateOrderStatusDataUseCase {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    async execute(id: string, updateOrderStatusDataDto: UpdateOrderStatusDataDto): Promise<OrderStatusEntity> {
        try {
            // Verificar que el estado exista
            const existingStatus = await this.orderStatusRepository.findById(id);
            if (!existingStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            // Si se está actualizando el código, verificar que no exista otro con el mismo código
            if (updateOrderStatusDataDto.name) {
                // Buscar por código si se está cambiando implícitamente
                // (esto podría mejorarse si el DTO incluyera código)
            }

            const updatedStatus = await this.orderStatusRepository.update(id, updateOrderStatusDataDto);

            logger.info(`Estado de pedido actualizado exitosamente: ${updatedStatus.code}`);
            return updatedStatus;

        } catch (error) {
            logger.error('Error en UpdateOrderStatusDataUseCase:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al actualizar estado de pedido');
        }
    }
}
