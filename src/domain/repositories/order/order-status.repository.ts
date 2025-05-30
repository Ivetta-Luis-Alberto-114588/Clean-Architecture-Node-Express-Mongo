// src/domain/repositories/order/order-status.repository.ts
import { CreateOrderStatusDto } from "../../dtos/order/create-order-status.dto";
import { UpdateOrderStatusDataDto } from "../../dtos/order/update-order-status-data.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderStatusEntity } from "../../entities/order/order-status.entity";

export abstract class OrderStatusRepository {
    abstract create(createOrderStatusDto: CreateOrderStatusDto): Promise<OrderStatusEntity>;
    abstract getAll(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; orderStatuses: OrderStatusEntity[] }>;
    abstract findById(id: string): Promise<OrderStatusEntity>;
    abstract findByCode(code: string): Promise<OrderStatusEntity | null>;
    abstract findDefault(): Promise<OrderStatusEntity | null>;
    abstract update(id: string, updateOrderStatusDataDto: UpdateOrderStatusDataDto): Promise<OrderStatusEntity>;
    abstract delete(id: string): Promise<OrderStatusEntity>;
    abstract validateTransition(fromStatusId: string, toStatusId: string): Promise<boolean>;
}
