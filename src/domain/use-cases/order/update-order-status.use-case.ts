import { UpdateOrderStatusDto } from "../../dtos/order/update-order-status.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import logger from "../../../configs/logger";

interface IUpdateOrderStatusUseCase {
    execute(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity>
}

export class UpdateOrderStatusUseCase implements IUpdateOrderStatusUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    async execute(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        try {
            // Verificar que el pedido exista
            const existingOrder = await this.orderRepository.findById(id);
            if (!existingOrder) {
                throw CustomError.notFound('Pedido no encontrado');
            }

            // Verificar que el nuevo estado exista y esté activo
            const newStatus = await this.orderStatusRepository.findById(updateOrderStatusDto.statusId);
            if (!newStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            if (!newStatus.isActive) {
                throw CustomError.badRequest('No se puede cambiar a un estado inactivo');
            }            // Verificar si el estado actual es diferente al nuevo
            if (existingOrder.status.id === updateOrderStatusDto.statusId) {
                throw CustomError.badRequest(`El pedido ya tiene el estado '${newStatus.name}'`);
            }

            // Validar la transición si existe un estado actual
            if (existingOrder.status) {
                const isValidTransition = await this.orderStatusRepository.validateTransition(
                    existingOrder.status.id,
                    updateOrderStatusDto.statusId
                );

                if (!isValidTransition) {
                    throw CustomError.badRequest(
                        `Transición no permitida de '${existingOrder.status.name}' a '${newStatus.name}'`
                    );
                }
            }

            // Actualizar el estado del pedido
            const updatedOrder = await this.orderRepository.updateStatus(id, updateOrderStatusDto);

            logger.info(`Estado de pedido actualizado: ${id} -> ${newStatus.name}`);
            return updatedOrder;

        } catch (error) {
            logger.error('Error en UpdateOrderStatusUseCase:', error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('Error interno del servidor al actualizar estado de pedido');
        }
    }
}