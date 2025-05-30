// src/infrastructure/mappers/order/order-status.mapper.ts
import { OrderStatusEntity } from "../../../domain/entities/order/order-status.entity";

export class OrderStatusMapper {
    static fromObjectToEntity(object: { [key: string]: any }): OrderStatusEntity {
        const { _id, id, code, name, description, color, order, isActive, isDefault, canTransitionTo, createdAt, updatedAt } = object;

        return new OrderStatusEntity(
            _id || id,
            code,
            name,
            description,
            color,
            order,
            isActive,
            isDefault,
            canTransitionTo ? canTransitionTo.map((item: any) => item._id || item.id || item) : [],
            createdAt,
            updatedAt
        );
    }
}
