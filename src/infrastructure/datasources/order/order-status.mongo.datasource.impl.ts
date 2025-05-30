// src/infrastructure/datasources/order/order-status.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { OrderStatusDataSource } from "../../../domain/datasources/order/order-status.datasource";
import { CreateOrderStatusDto } from "../../../domain/dtos/order/create-order-status.dto";
import { UpdateOrderStatusDataDto } from "../../../domain/dtos/order/update-order-status-data.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { OrderStatusEntity } from "../../../domain/entities/order/order-status.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { OrderStatusModel } from "../../../data/mongodb/models/order/order-status.model";
import { OrderStatusMapper } from "../../mappers/order/order-status.mapper";
import logger from "../../../configs/logger";

export class OrderStatusMongoDataSourceImpl implements OrderStatusDataSource {

    async create(createOrderStatusDto: CreateOrderStatusDto): Promise<OrderStatusEntity> {
        try {
            // Verificar que el código no exista
            const existingByCode = await OrderStatusModel.findOne({ code: createOrderStatusDto.code });
            if (existingByCode) {
                throw CustomError.badRequest(`Ya existe un estado con código '${createOrderStatusDto.code}'`);
            }

            // Si se marca como default, desmarcar otros defaults
            if (createOrderStatusDto.isDefault) {
                await OrderStatusModel.updateMany({}, { isDefault: false });
            }

            const orderStatus = new OrderStatusModel(createOrderStatusDto);
            await orderStatus.save();

            logger.info(`Estado de pedido creado: ${orderStatus.code}`);
            return OrderStatusMapper.fromObjectToEntity(orderStatus);

        } catch (error) {
            logger.error('Error creando estado de pedido:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al crear estado de pedido');
        }
    }

    async getAll(paginationDto: PaginationDto, activeOnly: boolean = false): Promise<{ total: number; orderStatuses: OrderStatusEntity[] }> {
        try {
            const { page, limit } = paginationDto;
            const skip = (page - 1) * limit;

            const filter = activeOnly ? { isActive: true } : {};

            const [orderStatuses, total] = await Promise.all([
                OrderStatusModel
                    .find(filter)
                    .populate('canTransitionTo', 'code name')
                    .sort({ order: 1, createdAt: 1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                OrderStatusModel.countDocuments(filter)
            ]);

            return {
                total,
                orderStatuses: orderStatuses.map(OrderStatusMapper.fromObjectToEntity)
            };

        } catch (error) {
            logger.error('Error obteniendo estados de pedido:', error);
            throw CustomError.internalServerError('Error interno del servidor al obtener estados de pedido');
        }
    }

    async findById(id: string): Promise<OrderStatusEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw CustomError.badRequest('ID de estado de pedido inválido');
            }

            const orderStatus = await OrderStatusModel
                .findById(id)
                .populate('canTransitionTo', 'code name')
                .lean();

            if (!orderStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            return OrderStatusMapper.fromObjectToEntity(orderStatus);

        } catch (error) {
            logger.error(`Error obteniendo estado de pedido ${id}:`, error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al obtener estado de pedido');
        }
    }

    async findByCode(code: string): Promise<OrderStatusEntity | null> {
        try {
            const orderStatus = await OrderStatusModel
                .findOne({ code: code.toUpperCase() })
                .populate('canTransitionTo', 'code name')
                .lean();

            return orderStatus ? OrderStatusMapper.fromObjectToEntity(orderStatus) : null;

        } catch (error) {
            logger.error(`Error obteniendo estado de pedido por código ${code}:`, error);
            throw CustomError.internalServerError('Error interno del servidor al obtener estado de pedido');
        }
    }

    async findDefault(): Promise<OrderStatusEntity | null> {
        try {
            const orderStatus = await OrderStatusModel
                .findOne({ isDefault: true, isActive: true })
                .populate('canTransitionTo', 'code name')
                .lean();

            return orderStatus ? OrderStatusMapper.fromObjectToEntity(orderStatus) : null;

        } catch (error) {
            logger.error('Error obteniendo estado de pedido por defecto:', error);
            throw CustomError.internalServerError('Error interno del servidor al obtener estado de pedido por defecto');
        }
    }

    async update(id: string, updateOrderStatusDataDto: UpdateOrderStatusDataDto): Promise<OrderStatusEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw CustomError.badRequest('ID de estado de pedido inválido');
            }

            // Si se marca como default, desmarcar otros defaults
            if (updateOrderStatusDataDto.isDefault) {
                await OrderStatusModel.updateMany({ _id: { $ne: id } }, { isDefault: false });
            }

            const updatedOrderStatus = await OrderStatusModel
                .findByIdAndUpdate(id, updateOrderStatusDataDto, { new: true })
                .populate('canTransitionTo', 'code name')
                .lean();

            if (!updatedOrderStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            logger.info(`Estado de pedido actualizado: ${updatedOrderStatus.code}`);
            return OrderStatusMapper.fromObjectToEntity(updatedOrderStatus);

        } catch (error) {
            logger.error(`Error actualizando estado de pedido ${id}:`, error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al actualizar estado de pedido');
        }
    }

    async delete(id: string): Promise<OrderStatusEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw CustomError.badRequest('ID de estado de pedido inválido');
            }

            // Verificar que no esté siendo usado en pedidos
            const { OrderModel } = await import('../../../data/mongodb/models/order/order.model');
            const ordersUsingStatus = await OrderModel.countDocuments({ status: id });

            if (ordersUsingStatus > 0) {
                throw CustomError.badRequest('No se puede eliminar un estado que está siendo usado en pedidos');
            }

            const deletedOrderStatus = await OrderStatusModel
                .findByIdAndDelete(id)
                .populate('canTransitionTo', 'code name')
                .lean();

            if (!deletedOrderStatus) {
                throw CustomError.notFound('Estado de pedido no encontrado');
            }

            logger.info(`Estado de pedido eliminado: ${deletedOrderStatus.code}`);
            return OrderStatusMapper.fromObjectToEntity(deletedOrderStatus);

        } catch (error) {
            logger.error(`Error eliminando estado de pedido ${id}:`, error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al eliminar estado de pedido');
        }
    }

    async validateTransition(fromStatusId: string, toStatusId: string): Promise<boolean> {
        try {
            if (!mongoose.Types.ObjectId.isValid(fromStatusId) || !mongoose.Types.ObjectId.isValid(toStatusId)) {
                return false;
            }

            const fromStatus = await OrderStatusModel.findById(fromStatusId);
            if (!fromStatus) return false;

            // Si no tiene restricciones, permitir cualquier transición
            if (!fromStatus.canTransitionTo || fromStatus.canTransitionTo.length === 0) {
                return true;
            }

            // Verificar si la transición está permitida
            return fromStatus.canTransitionTo.some(id => id.toString() === toStatusId);

        } catch (error) {
            logger.error('Error validando transición de estado:', error);
            return false;
        }
    }
}
