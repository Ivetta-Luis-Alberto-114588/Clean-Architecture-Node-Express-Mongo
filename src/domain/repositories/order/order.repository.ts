import { CreateOrderDto } from "../../dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../dtos/order/update-order-status.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";

export abstract class OrderRepository {
    abstract create(createSaleDto: CreateOrderDto): Promise<OrderEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<OrderEntity[]>;
    abstract findById(id: string): Promise<OrderEntity>;
    abstract updateStatus(id: string, updateSaleStatusDto: UpdateOrderStatusDto): Promise<OrderEntity>;
    abstract findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]>;
    abstract findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]>;
}