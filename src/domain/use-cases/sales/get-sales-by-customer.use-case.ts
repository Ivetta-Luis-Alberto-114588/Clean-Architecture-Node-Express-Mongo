// src/domain/use-cases/sales/get-sales-by-customer.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { SaleRepository } from "../../repositories/sales/sale.repository";

export interface GetSalesByCustomerUseCase {
    execute(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }>;
}

export class GetSalesByCustomerUseCaseImpl implements GetSalesByCustomerUseCase {

    constructor(
        private readonly saleRepository: SaleRepository
    ) { }

    async execute(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        return await this.saleRepository.findByCustomer(customerId, paginationDto);
    }
}
