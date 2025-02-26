// src/infrastructure/repositories/payment/payment.repository.impl.ts

import { PaymentRepository } from "../../../domain/repositories/payment/payment.repository";
import { PaymentDataSource } from "../../../domain/datasources/payment/payment.datasource";
import { CreatePaymentDto } from "../../../domain/dtos/payment/create-payment.dto";
import { ProcessWebhookDto } from "../../../domain/dtos/payment/process-webhook.dto";
import { UpdatePaymentStatusDto } from "../../../domain/dtos/payment/update-payment-status.dto";
import { VerifyPaymentDto } from "../../../domain/dtos/payment/verify-payment.dto";
import { PaymentEntity } from "../../../domain/entities/payment/payment.entity";
import { MercadoPagoPayment, MercadoPagoPreferenceResponse } from "../../../domain/interfaces/payment/mercado-pago.interface";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";

export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(private readonly paymentDataSource: PaymentDataSource) {}

  async createPreference(createPaymentDto: CreatePaymentDto): Promise<MercadoPagoPreferenceResponse> {
    return this.paymentDataSource.createPreference(createPaymentDto);
  }

  async savePayment(createPaymentDto: CreatePaymentDto, preferenceResponse: MercadoPagoPreferenceResponse): Promise<PaymentEntity> {
    return this.paymentDataSource.savePayment(createPaymentDto, preferenceResponse);
  }

  async getPaymentById(id: string): Promise<PaymentEntity> {
    return this.paymentDataSource.getPaymentById(id);
  }

  async getPaymentByExternalReference(externalReference: string): Promise<PaymentEntity | null> {
    return this.paymentDataSource.getPaymentByExternalReference(externalReference);
  }

  async getPaymentByPreferenceId(preferenceId: string): Promise<PaymentEntity | null> {
    return this.paymentDataSource.getPaymentByPreferenceId(preferenceId);
  }

  async getPaymentsBySaleId(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    return this.paymentDataSource.getPaymentsBySaleId(saleId, paginationDto);
  }

  async getPaymentsByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    return this.paymentDataSource.getPaymentsByCustomerId(customerId, paginationDto);
  }

  async updatePaymentStatus(updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<PaymentEntity> {
    return this.paymentDataSource.updatePaymentStatus(updatePaymentStatusDto);
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<MercadoPagoPayment> {
    return this.paymentDataSource.verifyPayment(verifyPaymentDto);
  }

  async processWebhook(processWebhookDto: ProcessWebhookDto): Promise<PaymentEntity> {
    return this.paymentDataSource.processWebhook(processWebhookDto);
  }

  async getAllPayments(paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    return this.paymentDataSource.getAllPayments(paginationDto);
  }

  async getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentEntity | null> {
    return this.paymentDataSource.getPaymentByIdempotencyKey(idempotencyKey);
  }
}