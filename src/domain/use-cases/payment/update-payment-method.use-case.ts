// src/domain/use-cases/payment/update-payment-method.use-case.ts

import { UpdatePaymentMethodDto } from "../../dtos/payment/update-payment-method.dto";
import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";

export interface UpdatePaymentMethodUseCase {
    execute(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodEntity>;
}

export class UpdatePaymentMethod implements UpdatePaymentMethodUseCase {

    constructor(
        private readonly repository: PaymentMethodRepository,
    ) { }

    async execute(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodEntity> {
        return await this.repository.update(id, updatePaymentMethodDto);
    }
}
