// src/domain/dtos/payment/create-payment.dto.ts

import { PaymentMethod, PaymentProvider } from "../../entities/payment/payment.entity";
import { MercadoPagoItem, MercadoPagoPayer } from "../../interfaces/payment/mercado-pago.interface";
import { CustomError } from "../../errors/custom.error";

export class CreatePaymentDto {
  private constructor(
    public saleId: string,
    public customerId: string,
    public amount: number,
    public provider: PaymentProvider,
    public items: MercadoPagoItem[],
    public payer: MercadoPagoPayer,
    public backUrls: {
      success: string;
      failure: string;
      pending: string;
    },
    public notificationUrl: string,
    public paymentMethod?: PaymentMethod,
    public externalReference?: string,
    public idempotencyKey?: string,
    public metadata?: any
  ) {}

  static create(object: { [key: string]: any }): [string?, CreatePaymentDto?] {
    const {
      saleId,
      customerId,
      amount,
      provider = PaymentProvider.MERCADO_PAGO,
      items,
      payer,
      backUrls,
      notificationUrl,
      paymentMethod,
      externalReference,
      idempotencyKey,
      metadata
    } = object;

    // Validaciones
    if (!saleId) return ['saleId es requerido', undefined];
    if (!customerId) return ['customerId es requerido', undefined];
    if (!amount || amount <= 0) return ['amount debe ser mayor a 0', undefined];
    if (!items || !Array.isArray(items) || items.length === 0) return ['items debe ser un array no vacío', undefined];
    if (!payer) return ['payer es requerido', undefined];
    if (!payer.email) return ['email del pagador es requerido', undefined];
    if (!backUrls) return ['backUrls es requerido', undefined];
    if (!backUrls.success) return ['backUrl de éxito es requerida', undefined];
    if (!backUrls.failure) return ['backUrl de fallo es requerida', undefined];
    if (!backUrls.pending) return ['backUrl de pendiente es requerida', undefined];
    if (!notificationUrl) return ['notificationUrl es requerida', undefined];

    // Validar items
    for (const item of items) {
      if (!item.id) return ['id del item es requerido', undefined];
      if (!item.title) return ['title del item es requerido', undefined];
      if (!item.quantity || item.quantity <= 0) return ['quantity del item debe ser mayor a 0', undefined];
      if (!item.unit_price || item.unit_price <= 0) return ['unit_price del item debe ser mayor a 0', undefined];
    }

    // Generar idempotencyKey si no se proporciona
    const generatedIdempotencyKey = idempotencyKey || `payment-${saleId}-${Date.now()}`;

    return [
      undefined,
      new CreatePaymentDto(
        saleId,
        customerId,
        amount,
        provider,
        items,
        payer,
        backUrls,
        notificationUrl,
        paymentMethod,
        externalReference || `sale-${saleId}`,
        generatedIdempotencyKey,
        metadata
      )
    ];
  }
}

