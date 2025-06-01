// src/domain/use-cases/sales/get-sale-by-id.use-case.ts
import { SaleEntity } from "../../entities/sales/sale.entity";
import { SaleRepository } from "../../repositories/sales/sale.repository";
import { CustomError } from "../../errors/custom.error";

export interface GetSaleByIdUseCase {
    execute(id: string): Promise<SaleEntity>;
}

export class GetSaleByIdUseCaseImpl implements GetSaleByIdUseCase {
    
    constructor(
        private readonly saleRepository: SaleRepository
    ) {}

    async execute(id: string): Promise<SaleEntity> {
        const sale = await this.saleRepository.findById(id);
        if (!sale) {
            throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
        }
        return sale;
    }
}
