// src/infrastructure/repositories/sales/sale.repository.impl.ts
import { CreateSaleDto } from "../../../domain/dtos/sales/create-sale.dto";
import { UpdateSaleStatusDto } from "../../../domain/dtos/sales/update-sale-status.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { SaleEntity } from "../../../domain/entities/sales/sale.entity";
import { SaleRepository } from "../../../domain/repositories/sales/sale.repository";
import { SaleDataSource } from "../../../domain/datasources/sales/sale.datasource";

export class SaleRepositoryImpl implements SaleRepository {
    
    constructor(
        private readonly saleDataSource: SaleDataSource
    ) {}

    create(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        return this.saleDataSource.create(createSaleDto);
    }    getAll(paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        return this.saleDataSource.getAll(paginationDto);
    }

    findById(id: string): Promise<SaleEntity> {
        return this.saleDataSource.findById(id);
    }

    updateStatus(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity> {
        return this.saleDataSource.updateStatus(id, updateSaleStatusDto);
    }

    findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        return this.saleDataSource.findByCustomer(customerId, paginationDto);
    }

    findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        return this.saleDataSource.findByDateRange(startDate, endDate, paginationDto);
    }

    findByStatus(status: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        return this.saleDataSource.findByStatus(status, paginationDto);
    }
}