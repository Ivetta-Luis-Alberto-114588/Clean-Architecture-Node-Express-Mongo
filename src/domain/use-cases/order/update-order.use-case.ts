import { OrderRepository } from '../../repositories/order/order.repository';
import { UpdateOrderDto } from '../../dtos/order/update-order.dto';
import { OrderEntity } from '../../entities/order/order.entity';

export class UpdateOrderUseCase {
  constructor(private readonly repo: OrderRepository) {}

  async execute(id: string, dto: UpdateOrderDto): Promise<OrderEntity> {
    return this.repo.updateOrder(id, dto);
  }
}