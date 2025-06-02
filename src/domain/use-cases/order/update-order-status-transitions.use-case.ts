// src/domain/use-cases/order/update-order-status-transitions.use-case.ts
import { OrderStatusEntity } from "../../entities/order/order-status.entity";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import { UpdateOrderStatusTransitionsDto } from "../../dtos/order/update-order-status-transitions.dto";
import { UpdateOrderStatusDataDto } from "../../dtos/order/update-order-status-data.dto";
import { CustomError } from "../../errors/custom.error";
import mongoose from "mongoose";
import logger from "../../../configs/logger";

export interface UpdateOrderStatusTransitionsUseCase {
    execute(id: string, dto: UpdateOrderStatusTransitionsDto): Promise<OrderStatusEntity>;
}

export class UpdateOrderStatusTransitionsUseCaseImpl implements UpdateOrderStatusTransitionsUseCase {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    async execute(id: string, dto: UpdateOrderStatusTransitionsDto): Promise<OrderStatusEntity> {
        try {
            // Verificar que el estado de origen existe
            const existingStatus = await this.orderStatusRepository.findById(id);
            if (!existingStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            // Convertir códigos de estado a ObjectIds si es necesario
            const transitionIds: string[] = [];
            
            for (const transition of dto.canTransitionTo) {
                // Verificar si es un ObjectId válido
                if (mongoose.Types.ObjectId.isValid(transition)) {
                    // Verificar que el ObjectId existe en la base de datos
                    const statusById = await this.orderStatusRepository.findById(transition);
                    if (!statusById) {
                        throw CustomError.badRequest(`Estado de destino con ID ${transition} no encontrado`);
                    }
                    transitionIds.push(transition);
                } else {
                    // Asumir que es un código de estado
                    const statusByCode = await this.orderStatusRepository.findByCode(transition.toUpperCase());
                    if (!statusByCode) {
                        throw CustomError.badRequest(`Estado de destino con código '${transition}' no encontrado`);
                    }
                    transitionIds.push(statusByCode.id);
                }
            }

            // Verificar que no hay autoreferencias
            if (transitionIds.includes(id)) {
                throw CustomError.badRequest('Un estado no puede hacer transición a sí mismo');
            }

            // Crear DTO para actualización manteniendo los valores existentes
            const updateDto = new UpdateOrderStatusDataDto(
                existingStatus.code,
                existingStatus.name,
                existingStatus.description,
                existingStatus.color,
                existingStatus.order,
                existingStatus.isActive,
                existingStatus.isDefault,
                transitionIds
            );

            const updatedStatus = await this.orderStatusRepository.update(id, updateDto);
            
            logger.info(`Transiciones actualizadas para estado: ${existingStatus.code}`);
            return updatedStatus;

        } catch (error) {
            logger.error('Error en UpdateOrderStatusTransitionsUseCaseImpl:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al actualizar transiciones de estado');
        }
    }
}
