// src/domain/use-cases/sales/update-sale-status.use-case.ts
import { UpdateSaleStatusDto } from "../../dtos/sales/update-sale-status.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { SaleRepository } from "../../repositories/sales/sale.repository";
import { CustomError } from "../../errors/custom.error";

export interface UpdateSaleStatusUseCase {
    execute(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity>;
}

export class UpdateSaleStatusUseCaseImpl implements UpdateSaleStatusUseCase {
    
    constructor(
        private readonly saleRepository: SaleRepository
    ) {}

    async execute(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity> {
        // Verificar que la venta existe
        const existingSale = await this.saleRepository.findById(id);
        if (!existingSale) {
            throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
        }

        // Validar transición de estados (opcional - se puede mejorar con lógica de negocio)
        if (existingSale.status === 'completed' && updateSaleStatusDto.status === 'pending') {
            throw CustomError.badRequest("No se puede cambiar una venta completada a pendiente");
        }

        if (existingSale.status === 'cancelled' && updateSaleStatusDto.status !== 'cancelled') {
            throw CustomError.badRequest("No se puede cambiar el estado de una venta cancelada");
        }

        // Actualizar el estado
        return await this.saleRepository.updateStatus(id, updateSaleStatusDto);
    }
}
