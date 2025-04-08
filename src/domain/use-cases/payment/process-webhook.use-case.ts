import { ProcessWebhookDto } from "../../dtos/payment/process-webhook.dto";
import { PaymentEntity } from "../../entities/payment/payment.entity";
import { CustomError } from "../../errors/custom.error";
import { MercadoPagoPaymentStatus } from "../../interfaces/payment/mercado-pago.interface";
import { PaymentRepository } from "../../repositories/payment/payment.repository";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IProcessWebhookUseCase {
  execute(processWebhookDto: ProcessWebhookDto): Promise<PaymentEntity>;
}

export class ProcessWebhookUseCase implements IProcessWebhookUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository
  ) { }

  async execute(processWebhookDto: ProcessWebhookDto): Promise<PaymentEntity> {
    try {
      // Procesar la notificación del webhook
      const payment = await this.paymentRepository.processWebhook(processWebhookDto);

      // Si el pago está aprobado, actualizar el estado de la venta a 'completed'
      if (payment.status === MercadoPagoPaymentStatus.APPROVED) {
        await this.orderRepository.updateStatus(payment.saleId, {
          status: 'completed',
          notes: `Pago aprobado mediante webhook con ID ${payment.providerPaymentId}`
        });
      }

      return payment;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al procesar la notificación webhook: ${error}`);
    }
  }
}