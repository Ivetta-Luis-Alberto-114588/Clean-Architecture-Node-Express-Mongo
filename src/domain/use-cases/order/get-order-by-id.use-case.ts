import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IGetOrderByIdUseCase {
    execute(id: string): Promise<OrderEntity>
}

export class GetOrderByIdUseCase implements IGetOrderByIdUseCase {
    constructor(
        private readonly orderRepository: OrderRepository
    ) { }

    async execute(id: string): Promise<OrderEntity> {
        try {
            // Buscamos la venta por ID
            const order = await this.orderRepository.findById(id);

            // Si no existe, lanzamos un error
            if (!order) {
                throw CustomError.notFound('Venta no encontrada');
            }

            return order;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError('get-order-by-id-use-case error');
        }
    }
}