import { CreateSaleDto } from "../../dtos/sales/create-sale.dto";
import { UpdateSaleStatusDto } from "../../dtos/sales/update-sale-status.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";

export abstract class SaleRepository {
    abstract create(createSaleDto: CreateSaleDto): Promise<SaleEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<SaleEntity[]>;
    abstract findById(id: string): Promise<SaleEntity>;
    abstract updateStatus(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity>;
    abstract findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<SaleEntity[]>;
    abstract findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<SaleEntity[]>;
}