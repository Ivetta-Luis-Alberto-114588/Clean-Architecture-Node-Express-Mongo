// src/infrastructure/repositories/payment/payment-method.repository.impl.ts

import { PaymentMethodDataSource } from "../../../domain/datasources/payment/payment-method.datasource";
import { CreatePaymentMethodDto } from "../../../domain/dtos/payment/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "../../../domain/dtos/payment/update-payment-method.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { PaymentMethodEntity } from "../../../domain/entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../../domain/repositories/payment/payment-method.repository";

export class PaymentMethodRepositoryImpl implements PaymentMethodRepository {

    constructor(private readonly paymentMethodDataSource: PaymentMethodDataSource) { }

    create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity> {
        return this.paymentMethodDataSource.create(createPaymentMethodDto);
    }

    getAll(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; paymentMethods: PaymentMethodEntity[] }> {
        return this.paymentMethodDataSource.getAll(paginationDto, activeOnly);
    }

    findById(id: string): Promise<PaymentMethodEntity | null> {
        return this.paymentMethodDataSource.findById(id);
    }

    findByCode(code: string): Promise<PaymentMethodEntity | null> {
        return this.paymentMethodDataSource.findByCode(code);
    }

    update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodEntity> {
        return this.paymentMethodDataSource.update(id, updatePaymentMethodDto);
    }

    delete(id: string): Promise<PaymentMethodEntity> {
        return this.paymentMethodDataSource.delete(id);
    }

    findActive(): Promise<PaymentMethodEntity[]> {
        return this.paymentMethodDataSource.findActive();
    }
}
