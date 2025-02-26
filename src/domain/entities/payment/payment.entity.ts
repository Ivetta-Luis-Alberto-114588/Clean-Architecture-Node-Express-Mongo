// src/domain/entities/payment/payment.entity.ts

import { MercadoPagoPaymentStatus } from '../../interfaces/payment/mercado-pago.interface';
import { CustomerEntity } from '../customers/customer';
import { SaleEntity } from '../sales/sale.entity';

export enum PaymentProvider {
  MERCADO_PAGO = 'mercado_pago',
  // Otros proveedores que se puedan agregar en el futuro
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  OTHER = 'other'
}

export class PaymentEntity {
  constructor(
    public id: string,
    public saleId: string,
    public sale: SaleEntity,
    public customerId: string,
    public customer: CustomerEntity,
    public amount: number,
    public provider: PaymentProvider,
    public status: MercadoPagoPaymentStatus,
    public externalReference: string,
    public providerPaymentId: string,
    public preferenceId: string,
    public paymentMethod: PaymentMethod,
    public createdAt: Date,
    public updatedAt: Date,
    public metadata?: any,
    public idempotencyKey?: string
  ) {}
}