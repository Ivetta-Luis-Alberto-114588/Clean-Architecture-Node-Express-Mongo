// src/infrastructure/repositories/order/order.repository.impl.ts
import { OrderDataSource } from "../../../domain/datasources/order/order.datasource";
import { CreateOrderDto } from "../../../domain/dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../../domain/dtos/order/update-order-status.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { OrderEntity } from "../../../domain/entities/order/order.entity";
import { OrderRepository } from "../../../domain/repositories/order/order.repository";

export class OrderRepositoryImpl implements OrderRepository {

    constructor(private readonly orderDataSource: OrderDataSource) { }

    // <<<--- Modificar firma de create --- >>>
    async create(
        createSaleDto: CreateOrderDto,
        calculatedDiscountRate: number,
        couponIdToIncrement: string | null | undefined,
        finalCustomerId: string // Recibir el argumento
    ): Promise<OrderEntity> {
        return await this.orderDataSource.create(
            createSaleDto,
            calculatedDiscountRate,
            couponIdToIncrement,
            finalCustomerId // Pasar el argumento al datasource
        );
    }

    async getAll(paginationDto: PaginationDto): Promise<OrderEntity[]> {
        return await this.orderDataSource.getAll(paginationDto);
    }

    async findById(id: string): Promise<OrderEntity> {
        return await this.orderDataSource.findById(id);
    }

    async updateStatus(id: string, updateSaleStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        return await this.orderDataSource.updateStatus(id, updateSaleStatusDto);
    }

    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]> {
        return await this.orderDataSource.findByCustomer(customerId, paginationDto);
    }

    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]> {
        return await this.orderDataSource.findByDateRange(startDate, endDate, paginationDto);
    }
}