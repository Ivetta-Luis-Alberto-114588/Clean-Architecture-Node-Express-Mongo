// src/infrastructure/repositories/order/order.repository.impl.ts
import { OrderDataSource } from "../../../domain/datasources/order/order.datasource";
import { CreateOrderDto } from "../../../domain/dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../../domain/dtos/order/update-order-status.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { OrderEntity } from "../../../domain/entities/order/order.entity";
import { OrderRepository } from "../../../domain/repositories/order/order.repository";

// Interfaz para detalles resueltos (importar o definir)
interface ResolvedShippingDetails {
    recipientName: string; phone: string; streetAddress: string; postalCode?: string;
    neighborhoodName: string; cityName: string; additionalInfo?: string;
    originalAddressId?: string; originalNeighborhoodId: string; originalCityId: string;
}

export class OrderRepositoryImpl implements OrderRepository {

    constructor(private readonly orderDataSource: OrderDataSource) { }

    async create(
        createSaleDto: CreateOrderDto,
        calculatedDiscountRate: number,
        couponIdToIncrement: string | null | undefined,
        finalCustomerId: string,
        shippingDetails: ResolvedShippingDetails
    ): Promise<OrderEntity> {
        return await this.orderDataSource.create(
            createSaleDto, calculatedDiscountRate, couponIdToIncrement, finalCustomerId, shippingDetails
        );
    }

    // --- MÉTODO getAll MODIFICADO ---
    async getAll(paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        return this.orderDataSource.getAll(paginationDto);
    }
    // --- FIN MÉTODO getAll MODIFICADO ---

    async findById(id: string): Promise<OrderEntity> {
        return this.orderDataSource.findById(id);
    }

    async updateStatus(id: string, updateSaleStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        return this.orderDataSource.updateStatus(id, updateSaleStatusDto);
    }

    // --- MÉTODO findByCustomer MODIFICADO ---
    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        return this.orderDataSource.findByCustomer(customerId, paginationDto);
    }
    // --- FIN MÉTODO findByCustomer MODIFICADO ---

    // --- MÉTODO findByDateRange MODIFICADO ---
    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        return this.orderDataSource.findByDateRange(startDate, endDate, paginationDto);
    }
    // --- FIN MÉTODO findByDateRange MODIFICADO ---
}