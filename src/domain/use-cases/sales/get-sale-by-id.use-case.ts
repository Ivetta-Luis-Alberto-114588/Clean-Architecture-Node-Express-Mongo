import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { SaleRepository } from "../../repositories/sales/sale.repository";

interface IGetSaleByIdUseCase {
    execute(id: string): Promise<OrderEntity>
}

export class GetSaleByIdUseCase implements IGetSaleByIdUseCase {
    constructor(
        private readonly saleRepository: SaleRepository
    ) { }

    async execute(id: string): Promise<OrderEntity> {
        try {
            // Buscamos la venta por ID
            const sale = await this.saleRepository.findById(id);

            // Si no existe, lanzamos un error
            if (!sale) {
                throw CustomError.notFound('Venta no encontrada');
            }

            return sale;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-sale-by-id-use-case error');
        }
    }
}