// src/domain/use-cases/delivery-methods/create-delivery-method.use-case.ts

import { CreateDeliveryMethodDto } from '../../dtos/delivery-methods/create-delivery-method.dto';
import { DeliveryMethodEntity } from '../../entities/delivery-methods/delivery-method.entity';
import { DeliveryMethodRepository } from '../../repositories/delivery-methods/delivery-method.repository';
import { CustomError } from '../../errors/custom.error';

export interface CreateDeliveryMethodUseCase {
    execute(createDeliveryMethodDto: CreateDeliveryMethodDto): Promise<DeliveryMethodEntity>;
}

export class CreateDeliveryMethod implements CreateDeliveryMethodUseCase {
    constructor(
        private readonly deliveryMethodRepository: DeliveryMethodRepository
    ) { }

    async execute(createDeliveryMethodDto: CreateDeliveryMethodDto): Promise<DeliveryMethodEntity> {
        // Verificar si ya existe un método con el mismo código
        const existingMethod = await this.deliveryMethodRepository.findByCode(createDeliveryMethodDto.code);
        if (existingMethod) {
            throw CustomError.badRequest(`Delivery method with code ${createDeliveryMethodDto.code} already exists`);
        }

        return await this.deliveryMethodRepository.create(createDeliveryMethodDto);
    }
}
