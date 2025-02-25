import { UpdateSaleStatusDto } from "../../dtos/sales/update-sale-status.dto";
import { SaleEntity } from "../../entities/sales/sale.entity";
import { CustomError } from "../../errors/custom.error";
import { SaleRepository } from "../../repositories/sales/sale.repository";

interface IUpdateSaleStatusUseCase {
    execute(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity>
}

export class UpdateSaleStatusUseCase implements IUpdateSaleStatusUseCase {
    constructor(
        private readonly saleRepository: SaleRepository
    ){}

    async execute(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity> {
        try {
            // Verificamos que la venta exista
            const existingSale = await this.saleRepository.findById(id);
            if (!existingSale) {
                throw CustomError.notFound('update-sale-status-use-case, Venta no encontrada');
            }

            // Verificar si el estado actual es diferente al nuevo
            if (existingSale.status === updateSaleStatusDto.status) {
                throw CustomError.badRequest(`La venta ya tiene el estado '${updateSaleStatusDto.status}'`);
            }

            // Si la venta existe, procedemos a actualizar su estado
            const updatedSale = await this.saleRepository.updateStatus(id, updateSaleStatusDto);
            return updatedSale;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-sale-status-use-case, error interno del servidor');
        }
    }
}