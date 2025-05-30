// src/domain/use-cases/order/get-all-order-statuses.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderStatusEntity } from "../../entities/order/order-status.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderStatusRepository } from "../../repositories/order/order-status.repository";
import logger from "../../../configs/logger";

interface IGetAllOrderStatusesUseCase {
    execute(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; orderStatuses: OrderStatusEntity[] }>;
}

export class GetAllOrderStatusesUseCase implements IGetAllOrderStatusesUseCase {
    constructor(
        private readonly orderStatusRepository: OrderStatusRepository
    ) { }

    async execute(paginationDto: PaginationDto, activeOnly: boolean = false): Promise<{ total: number; orderStatuses: OrderStatusEntity[] }> {
        try {
            const result = await this.orderStatusRepository.getAll(paginationDto, activeOnly);

            logger.info(`Obtenidos ${result.orderStatuses.length} estados de pedido (total: ${result.total})`);
            return result;

        } catch (error) {
            logger.error('Error en GetAllOrderStatusesUseCase:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error interno del servidor al obtener estados de pedido');
        }
    }
}
