import { CreateOrderDto } from "../../dtos/order/create-order.dto";
import { OrderEntity } from "../../entities/order/order.entity";
import { CustomError } from "../../errors/custom.error";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { ProductRepository } from "../../repositories/products/product.repository";
import { OrderRepository } from "../../repositories/order/order.repository";

interface ICreateOrderUseCase {
    execute(createOrderDto: CreateOrderDto): Promise<OrderEntity>;
}

export class CreateOrderUseCase implements ICreateOrderUseCase {
    constructor(
        private readonly orderRepository: OrderRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly productRepository: ProductRepository
    ) { }

    async execute(createOrderDto: CreateOrderDto): Promise<OrderEntity> {
        try {
            // Verificar que el cliente exista
            const customer = await this.customerRepository.findById(createOrderDto.customerId);
            if (!customer) {
                throw CustomError.notFound(`Cliente con ID ${createOrderDto.customerId} no encontrado`);
            }

            // Verificar cada producto y que tenga stock suficiente
            for (const item of createOrderDto.items) {
                const product = await this.productRepository.findById(item.productId);
                if (!product) {
                    throw CustomError.notFound(`Producto con ID ${item.productId} no encontrado`);
                }

                if (product.stock < item.quantity) {
                    throw CustomError.badRequest(`Stock insuficiente para el producto ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
                }
            }

            // Crear la venta
            return await this.orderRepository.create(createOrderDto);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError(`Error al crear la venta: ${error}`);
        }
    }
}