// src/domain/use-cases/payment/get-payment-methods.use-case.ts

import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";

export interface GetPaymentMethodsUseCase {
    execute(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; paymentMethods: PaymentMethodEntity[] }>;
}

export class GetPaymentMethods implements GetPaymentMethodsUseCase {

    constructor(
        private readonly repository: PaymentMethodRepository,
    ) { }

    async execute(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; paymentMethods: PaymentMethodEntity[] }> {
        return await this.repository.getAll(paginationDto, activeOnly);
    }
}
