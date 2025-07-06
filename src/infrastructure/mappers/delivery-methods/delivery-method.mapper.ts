// src/infrastructure/mappers/delivery-methods/delivery-method.mapper.ts

import { DeliveryMethodEntity } from '../../../domain/entities/delivery-methods/delivery-method.entity';

export class DeliveryMethodMapper {
    static fromObjectToEntity(object: any): DeliveryMethodEntity {
        const { _id, id, code, name, description, requiresAddress, isActive, createdAt, updatedAt } = object;

        return new DeliveryMethodEntity(
            _id || id,
            code,
            name,
            description,
            requiresAddress,
            isActive,
            createdAt,
            updatedAt
        );
    }
}
