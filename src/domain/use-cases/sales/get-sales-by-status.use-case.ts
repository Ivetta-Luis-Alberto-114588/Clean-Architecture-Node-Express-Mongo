// src/domain/use-cases/sales/get-sales-by-status.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { SaleRepository } from "../../repositories/sales/sale.repository";

export interface GetSalesByStatusUseCase {
    execute(status: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }>;
}

export class GetSalesByStatusUseCaseImpl implements GetSalesByStatusUseCase {

    constructor(
        private readonly saleRepository: SaleRepository
    ) { }

    async execute(status: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        return await this.saleRepository.findByStatus(status, paginationDto);
    }
}
