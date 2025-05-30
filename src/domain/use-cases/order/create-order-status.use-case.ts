// src/domain/use-cases/order/create-order-status.use-case.ts
import { CreateOrderStatusDto } from "../../dtos/order/create-order-status.dto";
import { OrderStatusEntity } from "../../entities/order/order-status.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import logger from "../../../configs/logger";

interface ICreateOrderStatusUseCase {
    execute(createOrderStatusDto: CreateOrderStatusDto): Promise<OrderStatusEntity>;
}

export class CreateOrderStatusUseCase implements ICreateOrderStatusUseCase {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    async execute(createOrderStatusDto: CreateOrderStatusDto): Promise<OrderStatusEntity> {
        try {
            // Verificar que el código no exista
            const existingStatus = await this.orderStatusRepository.findByCode(createOrderStatusDto.code);
            if (existingStatus) {
                throw CustomError.badRequest(`Ya existe un estado con código '${createOrderStatusDto.code}'`);
            }

            const orderStatus = await this.orderStatusRepository.create(createOrderStatusDto);

            logger.info(`Estado de pedido creado exitosamente: ${orderStatus.code}`);
            return orderStatus;

        } catch (error) {
            logger.error('Error en CreateOrderStatusUseCase:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al crear estado de pedido');
        }
    }
}
