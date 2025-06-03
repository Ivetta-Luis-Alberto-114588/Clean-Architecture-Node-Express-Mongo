// src/domain/use-cases/payment/get-payment-method-by-id.use-case.ts

import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";

export interface GetPaymentMethodByIdUseCase {
    execute(id: string): Promise<PaymentMethodEntity | null>;
}

export class GetPaymentMethodById implements GetPaymentMethodByIdUseCase {

    constructor(
        private readonly repository: PaymentMethodRepository,
    ) { }

    async execute(id: string): Promise<PaymentMethodEntity | null> {
        return await this.repository.findById(id);
    }
}
