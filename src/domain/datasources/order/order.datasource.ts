// src/domain/datasources/order/order.datasource.ts
import { CreateOrderDto } from "../../dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../dtos/order/update-order-status.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";

// Interfaz para detalles resueltos (importar o definir)
interface ResolvedShippingDetails {
    recipientName: string; phone: string; streetAddress: string; postalCode?: string;
    neighborhoodName: string; cityName: string; additionalInfo?: string;
    originalAddressId?: string; originalNeighborhoodId: string; originalCityId: string;
}


export abstract class OrderDataSource {
    abstract create(
        createSaleDto: CreateOrderDto,
        calculatedDiscountRate: number,
        couponIdToIncrement: string | null | undefined,
        finalCustomerId: string,
        shippingDetails: ResolvedShippingDetails,
        defaultOrderStatusId: string
    ): Promise<OrderEntity>;

    // --- FIRMA MODIFICADA ---
    abstract getAll(paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>;
    // --- FIN FIRMA MODIFICADA ---

    abstract findById(id: string): Promise<OrderEntity>;
    abstract updateStatus(id: string, updateSaleStatusDto: UpdateOrderStatusDto): Promise<OrderEntity>;

    // --- FIRMA MODIFICADA ---
    abstract findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>;
    // --- FIN FIRMA MODIFICADA ---

    // --- FIRMA MODIFICADA ---
    abstract findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>;
    // --- FIN FIRMA MODIFICADA ---

    abstract findByStatus(statusId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }>; // NUEVO

    // Nuevo método para actualización completa de pedido
    abstract updateOrder(id: string, updateDto: import("../../dtos/order/update-order.dto").UpdateOrderDto): Promise<OrderEntity>;
}