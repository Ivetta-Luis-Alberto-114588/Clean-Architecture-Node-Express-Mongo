// src/domain/use-cases/payment/create-payment-method.use-case.ts

import { CreatePaymentMethodDto } from "../../dtos/payment/create-payment-method.dto";
import { PaymentMethodEntity } from "../../entities/payment/payment-method.entity";
import { PaymentMethodRepository } from "../../repositories/payment/payment-method.repository";

export interface CreatePaymentMethodUseCase {
    execute(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity>;
}

export class CreatePaymentMethod implements CreatePaymentMethodUseCase {

    constructor(
        private readonly repository: PaymentMethodRepository,
    ) { }

    async execute(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity> {
        return await this.repository.create(createPaymentMethodDto);
    }
}
