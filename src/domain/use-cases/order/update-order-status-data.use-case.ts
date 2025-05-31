// src/domain/use-cases/order/update-order-status-data.use-case.ts
import { UpdateOrderStatusDataDto } from "../../dtos/order/update-order-status-data.dto";
import { OrderStatusEntity } from "../../entities/order/order-status.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import logger from "../../../configs/logger";
import mongoose from "mongoose";

interface IUpdateOrderStatusDataUseCase {
    execute(id: string, updateOrderStatusDataDto: UpdateOrderStatusDataDto): Promise<OrderStatusEntity>;
}

export class UpdateOrderStatusDataUseCase implements IUpdateOrderStatusDataUseCase {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }    async execute(id: string, updateOrderStatusDataDto: UpdateOrderStatusDataDto): Promise<OrderStatusEntity> {
        try {
            // Verificar que el estado exista
            const existingStatus = await this.orderStatusRepository.findById(id);
            if (!existingStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            // Si se está actualizando el código, verificar que no exista otro con el mismo código
            if (updateOrderStatusDataDto.code) {
                const existingStatusWithCode = await this.orderStatusRepository.findByCode(updateOrderStatusDataDto.code);
                if (existingStatusWithCode && existingStatusWithCode.id !== id) {
                    throw CustomError.badRequest(`Ya existe un estado con el código: ${updateOrderStatusDataDto.code}`);
                }
            }

            // Convertir códigos de estado a ObjectIds si es necesario
            let processedDto = updateOrderStatusDataDto;
            if (updateOrderStatusDataDto.canTransitionTo && updateOrderStatusDataDto.canTransitionTo.length > 0) {
                const transitionIds: string[] = [];
                
                for (const transition of updateOrderStatusDataDto.canTransitionTo) {
                    // Si ya es un ObjectId válido, usarlo directamente
                    if (mongoose.Types.ObjectId.isValid(transition)) {
                        transitionIds.push(transition);
                    } else {
                        // Si es un código de estado, buscar el ObjectId correspondiente
                        const statusByCode = await this.orderStatusRepository.findByCode(transition.toUpperCase());
                        if (!statusByCode) {
                            throw CustomError.badRequest(`No se encontró el estado con código: ${transition}`);
                        }
                        transitionIds.push(statusByCode.id);
                    }
                }

                // Crear un nuevo DTO con los ObjectIds convertidos
                processedDto = new UpdateOrderStatusDataDto(
                    updateOrderStatusDataDto.code,
                    updateOrderStatusDataDto.name,
                    updateOrderStatusDataDto.description,
                    updateOrderStatusDataDto.color,
                    updateOrderStatusDataDto.order,
                    updateOrderStatusDataDto.isActive,
                    updateOrderStatusDataDto.isDefault,
                    transitionIds
                );
            }

            const updatedStatus = await this.orderStatusRepository.update(id, processedDto);

            logger.info(`Estado de pedido actualizado exitosamente: ${updatedStatus.code}`);
            return updatedStatus;

        } catch (error) {
            logger.error('Error en UpdateOrderStatusDataUseCase:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al actualizar estado de pedido');
        }
    }
}
