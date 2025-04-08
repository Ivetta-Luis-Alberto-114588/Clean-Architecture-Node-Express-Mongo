import { UpdateOrderStatusDto } from "../../dtos/order/update-order-status.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IUpdateOrderStatusUseCase {
    execute(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity>
}

export class UpdateOrderStatusUseCase implements IUpdateOrderStatusUseCase {
    constructor(
        private readonly orderRepository: OrderRepository
    ) { }

    async execute(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        try {
            // Verificamos que la venta exista
            const existingSale = await this.orderRepository.findById(id);
            if (!existingSale) {
                throw CustomError.notFound('update-sale-status-use-case, Venta no encontrada');
            }

            // Verificar si el estado actual es diferente al nuevo
            if (existingSale.status === updateOrderStatusDto.status) {
                throw CustomError.badRequest(`La venta ya tiene el estado '${updateOrderStatusDto.status}'`);
            }

            // Si la venta existe, procedemos a actualizar su estado
            const updatedSale = await this.orderRepository.updateStatus(id, updateOrderStatusDto);
            return updatedSale;

        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('update-sale-status-use-case, error interno del servidor');
        }
    }
}