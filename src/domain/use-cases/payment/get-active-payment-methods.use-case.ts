// src/domain/use-cases/payment/get-active-payment-methods.use-case.ts

import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";

export interface GetActivePaymentMethodsUseCase {
    execute(): Promise<PaymentMethodEntity[]>;
}

export class GetActivePaymentMethods implements GetActivePaymentMethodsUseCase {

    constructor(
        private readonly repository: PaymentMethodRepository,
    ) { }

    async execute(): Promise<PaymentMethodEntity[]> {
        return await this.repository.findActive();
    }
}
