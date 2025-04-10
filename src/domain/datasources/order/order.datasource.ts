// src/domain/datasources/order/order.datasource.ts
import { CreateOrderDto } from "../../dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../dtos/order/update-order-status.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { OrderEntity } from "../../entities/order/order.entity";

// <<<--- Interfaz para detalles resueltos (importar o definir) --- >>>
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
        shippingDetails: ResolvedShippingDetails // <<<--- AÑADIDO
    ): Promise<OrderEntity>;

    abstract getAll(paginationDto: PaginationDto): Promise<OrderEntity[]>;
    abstract findById(id: string): Promise<OrderEntity>;
    abstract updateStatus(id: string, updateSaleStatusDto: UpdateOrderStatusDto): Promise<OrderEntity>;
    abstract findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]>;
    abstract findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]>;
}