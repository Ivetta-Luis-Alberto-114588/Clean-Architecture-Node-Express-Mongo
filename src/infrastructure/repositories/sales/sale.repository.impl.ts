// src/infrastructure/repositories/sales/sale.repository.impl.ts
import { SaleDataSource } from "../../../domain/datasources/sales/sale.datasource";
import { CreateSaleDto } from "../../../domain/dtos/sales/create-sale.dto";
import { UpdateSaleStatusDto } from "../../../domain/dtos/sales/update-sale-status.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { SaleEntity } from "../../../domain/entities/sales/sale.entity";
import { SaleRepository } from "../../../domain/repositories/sales/sale.repository";

export class SaleRepositoryImpl implements SaleRepository {
    
    constructor(private readonly saleDataSource: SaleDataSource) {}
    
    async create(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        return await this.saleDataSource.create(createSaleDto);
    }
    
    async getAll(paginationDto: PaginationDto): Promise<SaleEntity[]> {
        return await this.saleDataSource.getAll(paginationDto);
    }
    
    async findById(id: string): Promise<SaleEntity> {
        return await this.saleDataSource.findById(id);
    }
    
    async updateStatus(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity> {
        return await this.saleDataSource.updateStatus(id, updateSaleStatusDto);
    }
    
    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<SaleEntity[]> {
        return await this.saleDataSource.findByCustomer(customerId, paginationDto);
    }
    
    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<SaleEntity[]> {
        return await this.saleDataSource.findByDateRange(startDate, endDate, paginationDto);
    }
}