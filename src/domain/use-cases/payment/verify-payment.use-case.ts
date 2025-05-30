import { VerifyPaymentDto } from "../../dtos/payment/verify-payment.dto";
import { UpdatePaymentStatusDto } from "../../dtos/payment/update-payment-status.dto";
import { PaymentEntity } from "../../entities/payment/payment.entity";
import { CustomError } from "../../errors/custom.error";
import { MercadoPagoPayment, MercadoPagoPaymentStatus } from "../../interfaces/payment/mercado-pago.interface";
import { PaymentRepository } from "../../repositories/payment/payment.repository";
import { OrderRepository } from "../../repositories/order/order.repository";

interface IVerifyPaymentUseCase {
  execute(verifyPaymentDto: VerifyPaymentDto): Promise<{
    payment: PaymentEntity;
    paymentInfo: MercadoPagoPayment;
  }>;
}

export class VerifyPaymentUseCase implements IVerifyPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository
  ) { }

  async execute(verifyPaymentDto: VerifyPaymentDto): Promise<{
    payment: PaymentEntity;
    paymentInfo: MercadoPagoPayment;
  }> {
    try {
      // Obtener el pago
      const payment = await this.paymentRepository.getPaymentById(verifyPaymentDto.paymentId);

      // Verificar el pago con Mercado Pago
      const paymentInfo = await this.paymentRepository.verifyPayment(verifyPaymentDto);

      // Si el pago está aprobado pero nuestro registro todavía está pendiente, actualizarlo
      if (
        paymentInfo.status === MercadoPagoPaymentStatus.APPROVED &&
        payment.status !== MercadoPagoPaymentStatus.APPROVED
      ) {
        // Actualizar el estado del pago
        const updatePaymentStatusDto = UpdatePaymentStatusDto.create({
          paymentId: payment.id,
          status: paymentInfo.status,
          providerPaymentId: paymentInfo.id.toString(),
          metadata: paymentInfo
        });

        if (updatePaymentStatusDto[0]) {
          throw CustomError.badRequest(updatePaymentStatusDto[0]);
        }

        // Actualizar el pago
        const updatedPayment = await this.paymentRepository.updatePaymentStatus(updatePaymentStatusDto[1]!);

        // Si el pago está aprobado, actualizar el estado de la venta a 'completed'
        if (paymentInfo.status === MercadoPagoPaymentStatus.APPROVED) {
          await this.orderRepository.updateStatus(payment.saleId, {
            statusId: '683a1a39dd398aae92ab05fa', // COMPLETED status ID
            notes: `Pago aprobado con ID ${paymentInfo.id}`
          });
        }

        return {
          payment: updatedPayment,
          paymentInfo
        };
      }

      return {
        payment,
        paymentInfo
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al verificar el pago: ${error}`);
    }
  }
}