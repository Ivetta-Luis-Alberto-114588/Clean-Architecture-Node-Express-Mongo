// src/domain/datasources/sales/sale.datasource.ts
import { CreateSaleDto } from "../../dtos/sales/create-sale.dto";
import { UpdateSaleStatusDto } from "../../dtos/sales/update-sale-status.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";

export abstract class SaleDataSource {
    abstract create(createSaleDto: CreateSaleDto): Promise<SaleEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }>;
    abstract findById(id: string): Promise<SaleEntity>;
    abstract updateStatus(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity>;
    abstract findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }>;
    abstract findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }>;
    abstract findByStatus(status: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }>;
}
