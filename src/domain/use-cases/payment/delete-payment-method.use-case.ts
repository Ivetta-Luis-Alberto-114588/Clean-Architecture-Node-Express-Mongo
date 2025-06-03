// src/domain/use-cases/payment/delete-payment-method.use-case.ts

import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";

export interface DeletePaymentMethodUseCase {
    execute(id: string): Promise<PaymentMethodEntity>;
}

export class DeletePaymentMethod implements DeletePaymentMethodUseCase {

    constructor(
        private readonly repository: PaymentMethodRepository,
    ) { }

    async execute(id: string): Promise<PaymentMethodEntity> {
        return await this.repository.delete(id);
    }
}
