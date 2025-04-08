import { CreatePaymentDto } from "../../dtos/payment/create-payment.dto";
import { PaymentEntity } from "../../entities/payment/payment.entity";
import { CustomError } from "../../errors/custom.error";
import { MercadoPagoPreferenceResponse } from "../../interfaces/payment/mercado-pago.interface";
import { PaymentRepository } from "../../repositories/payment/payment.repository";
import { CustomerRepository } from "../../repositories/customers/customer.repository";
import { OrderRepository } from "../../repositories/order/order.repository";

interface ICreatePaymentUseCase {
  execute(createPaymentDto: CreatePaymentDto): Promise<{
    payment: PaymentEntity;
    preference: MercadoPagoPreferenceResponse;
  }>;
}

export class CreatePaymentUseCase implements ICreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly orderRepository: OrderRepository
  ) { }

  async execute(createPaymentDto: CreatePaymentDto): Promise<{
    payment: PaymentEntity;
    preference: MercadoPagoPreferenceResponse;
  }> {
    try {
      // Verificar si ya existe un pago con la misma clave de idempotencia
      if (createPaymentDto.idempotencyKey) {
        const existingPayment = await this.paymentRepository.getPaymentByIdempotencyKey(
          createPaymentDto.idempotencyKey
        );

        if (existingPayment) {
          // Si ya existe un pago con la misma clave de idempotencia, reutilizar la preferencia
          const preference = await this.paymentRepository.createPreference(createPaymentDto);
          return {
            payment: existingPayment,
            preference
          };
        }
      }

      // Verificar que exista la venta
      const sale = await this.orderRepository.findById(createPaymentDto.saleId);
      if (!sale) {
        throw CustomError.notFound(`Venta con ID ${createPaymentDto.saleId} no encontrada`);
      }

      // Verificar que exista el cliente
      const customer = await this.customerRepository.findById(createPaymentDto.customerId);
      if (!customer) {
        throw CustomError.notFound(`Cliente con ID ${createPaymentDto.customerId} no encontrado`);
      }

      // Verificar que los montos coincidan
      if (sale.total !== createPaymentDto.amount) {
        throw CustomError.badRequest(
          `El monto del pago (${createPaymentDto.amount}) no coincide con el monto de la venta (${sale.total})`
        );
      }

      // Verificar que el cliente de la venta coincida con el cliente del pago
      if (sale.customer.id.toString() !== createPaymentDto.customerId) {
        throw CustomError.badRequest(
          `El cliente del pago no coincide con el cliente de la venta`
        );
      }

      // Crear preferencia de pago
      const preference = await this.paymentRepository.createPreference(createPaymentDto);

      // Guardar el pago en la base de datos
      const payment = await this.paymentRepository.savePayment(createPaymentDto, preference);

      return {
        payment,
        preference
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al crear el pago: ${error}`);
    }
  }
}