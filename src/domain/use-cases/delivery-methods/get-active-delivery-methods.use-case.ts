// src/domain/use-cases/delivery-methods/get-active-delivery-methods.use-case.ts

import { DeliveryMethodEntity } from '../../entities/delivery-methods/delivery-method.entity';
import { DeliveryMethodRepository } from '../../repositories/delivery-methods/delivery-method.repository';

export interface GetActiveDeliveryMethodsUseCase {
    execute(): Promise<DeliveryMethodEntity[]>;
}

export class GetActiveDeliveryMethods implements GetActiveDeliveryMethodsUseCase {
    constructor(
        private readonly deliveryMethodRepository: DeliveryMethodRepository
    ) { }

    async execute(): Promise<DeliveryMethodEntity[]> {
        return await this.deliveryMethodRepository.getActiveOnes();
    }
}
