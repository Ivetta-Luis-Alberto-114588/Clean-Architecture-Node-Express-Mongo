
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { PaymentEntity } from "../../entities/payment/payment.entity";
import { CustomError } from "../../errors/custom.error";
import { PaymentRepository } from "../../repositories/payment/payment.repository";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IGetPaymentByOrderUseCase {
  execute(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]>;
}

export class GetPaymentByOrderUseCase implements IGetPaymentByOrderUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository
  ) { }

  async execute(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      // Verificar que exista la venta
      const sale = await this.orderRepository.findById(saleId);
      if (!sale) {
        throw CustomError.notFound(`Venta con ID ${saleId} no encontrada`);
      }

      // Obtener los pagos de la venta
      const payments = await this.paymentRepository.getPaymentsBySaleId(saleId, paginationDto);
      return payments;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener los pagos de la venta: ${error}`);
    }
  }
}