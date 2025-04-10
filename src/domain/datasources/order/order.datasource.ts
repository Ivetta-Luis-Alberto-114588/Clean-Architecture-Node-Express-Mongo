// src/domain/datasources/order/order.datasource.ts
import { CreateOrderDto } from "../../dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../dtos/order/update-order-status.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";

export abstract class OrderDataSource {
    // <<<--- Modificar firma de create --- >>>
    abstract create(
        createSaleDto: CreateOrderDto,
        calculatedDiscountRate: number,
        couponIdToIncrement: string | null | undefined, // Hacerlo opcional explícito
        finalCustomerId: string // Añadir este argumento
    ): Promise<OrderEntity>;

    abstract getAll(paginationDto: PaginationDto): Promise<OrderEntity[]>;
    abstract findById(id: string): Promise<OrderEntity>;
    abstract updateStatus(id: string, updateSaleStatusDto: UpdateOrderStatusDto): Promise<OrderEntity>;
    abstract findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]>;
    abstract findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]>;
}