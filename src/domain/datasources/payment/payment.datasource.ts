import { CreatePaymentDto } from "../../dtos/payment/create-payment.dto";
import { ProcessWebhookDto } from "../../dtos/payment/process-webhook.dto";
import { UpdatePaymentStatusDto } from "../../dtos/payment/update-payment-status.dto";
import { VerifyPaymentDto } from "../../dtos/payment/verify-payment.dto";
import { PaymentEntity } from "../../entities/payment/payment.entity";
import { MercadoPagoPayment, MercadoPagoPreferenceResponse } from "../../interfaces/payment/mercado-pago.interface";
import { PaginationDto } from "../../dtos/shared/pagination.dto";

export abstract class PaymentDataSource {
  // Crear preferencia de pago en el proveedor (Mercado Pago)
  abstract createPreference(createPaymentDto: CreatePaymentDto): Promise<MercadoPagoPreferenceResponse>;
  
  // Guardar el pago en la base de datos
  abstract savePayment(createPaymentDto: CreatePaymentDto, preferenceResponse: MercadoPagoPreferenceResponse): Promise<PaymentEntity>;
  
  // Obtener un pago por su ID
  abstract getPaymentById(id: string): Promise<PaymentEntity>;
  
  // Obtener un pago por su referencia externa
  abstract getPaymentByExternalReference(externalReference: string): Promise<PaymentEntity | null>;
  
  // Obtener un pago por su ID de preferencia
  abstract getPaymentByPreferenceId(preferenceId: string): Promise<PaymentEntity | null>;
  
  // Obtener pagos por ID de venta
  abstract getPaymentsBySaleId(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]>;
  
  // Obtener pagos por ID de cliente
  abstract getPaymentsByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]>;
  
  // Actualizar el estado de un pago
  abstract updatePaymentStatus(updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<PaymentEntity>;
  
  // Verificar un pago con el proveedor (Mercado Pago)
  abstract verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<MercadoPagoPayment>;
  
  // Procesar una notificación de webhook
  abstract processWebhook(processWebhookDto: ProcessWebhookDto): Promise<PaymentEntity>;
  
  // Obtener todos los pagos con paginación
  abstract getAllPayments(paginationDto: PaginationDto): Promise<PaymentEntity[]>;
  
  // Verificar duplicidad por clave de idempotencia
  abstract getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentEntity | null>;
}