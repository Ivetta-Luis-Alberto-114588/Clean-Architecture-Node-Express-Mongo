// src/infrastructure/repositories/order/order-status.repository.impl.ts
import { OrderStatusDataSource } from "../../../domain/datasources/order/order-status.datasource";
import { CreateOrderStatusDto } from "../../../domain/dtos/order/create-order-status.dto";
import { UpdateOrderStatusDataDto } from "../../../domain/dtos/order/update-order-status-data.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { OrderStatusEntity } from "../../../domain/entities/order/order-status.entity";
import { OrderStatusRepository } from "../../../domain/repositories/order/order-status.repository";

export class OrderStatusRepositoryImpl implements OrderStatusRepository {
    constructor(
        private readonly orderStatusDataSource: OrderStatusDataSource
    ) { }

    create(createOrderStatusDto: CreateOrderStatusDto): Promise<OrderStatusEntity> {
        return this.orderStatusDataSource.create(createOrderStatusDto);
    }

    getAll(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; orderStatuses: OrderStatusEntity[] }> {
        return this.orderStatusDataSource.getAll(paginationDto, activeOnly);
    }

    findById(id: string): Promise<OrderStatusEntity> {
        return this.orderStatusDataSource.findById(id);
    }

    findByCode(code: string): Promise<OrderStatusEntity | null> {
        return this.orderStatusDataSource.findByCode(code);
    }

    findDefault(): Promise<OrderStatusEntity | null> {
        return this.orderStatusDataSource.findDefault();
    }

    update(id: string, updateOrderStatusDataDto: UpdateOrderStatusDataDto): Promise<OrderStatusEntity> {
        return this.orderStatusDataSource.update(id, updateOrderStatusDataDto);
    }

    delete(id: string): Promise<OrderStatusEntity> {
        return this.orderStatusDataSource.delete(id);
    }

    validateTransition(fromStatusId: string, toStatusId: string): Promise<boolean> {
        return this.orderStatusDataSource.validateTransition(fromStatusId, toStatusId);
    }
}
