import { PaymentEntity } from "../../entities/payment/payment.entity";
import { CustomError } from "../../errors/custom.error";
import { PaymentRepository } from "../../repositories/payment/payment.repository";

interface IGetPaymentUseCase {
  execute(id: string): Promise<PaymentEntity>;
}

export class GetPaymentUseCase implements IGetPaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<PaymentEntity> {
    try {
      const payment = await this.paymentRepository.getPaymentById(id);
      return payment;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener el pago: ${error}`);
    }
  }
}