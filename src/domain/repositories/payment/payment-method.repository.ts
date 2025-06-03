// src/domain/repositories/payment/payment-method.repository.ts

import { CreatePaymentMethodDto } from "../../dtos/payment/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "../../dtos/payment/update-payment-method.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";

export abstract class PaymentMethodRepository {
    abstract create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity>;
    abstract getAll(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; paymentMethods: PaymentMethodEntity[] }>;
    abstract findById(id: string): Promise<PaymentMethodEntity | null>;
    abstract findByCode(code: string): Promise<PaymentMethodEntity | null>;
    abstract update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodEntity>;
    abstract delete(id: string): Promise<PaymentMethodEntity>;
    abstract findActive(): Promise<PaymentMethodEntity[]>;
}
