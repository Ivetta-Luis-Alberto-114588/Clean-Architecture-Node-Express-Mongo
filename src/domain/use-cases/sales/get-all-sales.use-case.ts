// src/domain/use-cases/sales/get-all-sales.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { SaleRepository } from "../../repositories/sales/sale.repository";

export interface GetAllSalesUseCase {
    execute(paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }>;
}

export class GetAllSalesUseCaseImpl implements GetAllSalesUseCase {
    
    constructor(
        private readonly saleRepository: SaleRepository
    ) {}

    async execute(paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        return await this.saleRepository.getAll(paginationDto);
    }
}
