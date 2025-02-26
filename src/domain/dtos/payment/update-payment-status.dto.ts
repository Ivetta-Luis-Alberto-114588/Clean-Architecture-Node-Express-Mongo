import { MercadoPagoPaymentStatus } from "../../interfaces/payment/mercado-pago.interface";

export class UpdatePaymentStatusDto {
  private constructor(
    public paymentId: string,
    public status: MercadoPagoPaymentStatus,
    public providerPaymentId: string,
    public metadata?: any
  ) {}

  static create(object: { [key: string]: any }): [string?, UpdatePaymentStatusDto?] {
    const { paymentId, status, providerPaymentId, metadata } = object;

    // Validaciones
    if (!paymentId) return ['paymentId es requerido', undefined];
    if (!status) return ['status es requerido', undefined];
    if (!Object.values(MercadoPagoPaymentStatus).includes(status)) {
      return [`status debe ser uno de los siguientes valores: ${Object.values(MercadoPagoPaymentStatus).join(', ')}`, undefined];
    }
    if (!providerPaymentId) return ['providerPaymentId es requerido', undefined];

    return [
      undefined,
      new UpdatePaymentStatusDto(
        paymentId,
        status,
        providerPaymentId,
        metadata
      )
    ];
  }
}