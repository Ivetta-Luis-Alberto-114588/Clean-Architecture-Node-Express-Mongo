// src/domain/use-cases/payment/get-payment-method-by-code.use-case.ts

import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";

export interface GetPaymentMethodByCodeUseCase {
    execute(code: string): Promise<PaymentMethodEntity | null>;
}

export class GetPaymentMethodByCode implements GetPaymentMethodByCodeUseCase {

    constructor(
        private readonly repository: PaymentMethodRepository,
    ) { }

    async execute(code: string): Promise<PaymentMethodEntity | null> {
        return await this.repository.findByCode(code);
    }
}
