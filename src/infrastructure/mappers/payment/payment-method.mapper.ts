// src/infrastructure/mappers/payment/payment-method.mapper.ts
import { PaymentMethodEntity } from "../../../domain/entities/payment/payment-method.entity";
import { CustomError } from "../../../domain/errors/custom.error";

export class PaymentMethodMapper {
    static fromObjectToEntity(object: any): PaymentMethodEntity {
        if (!object) {
            throw CustomError.badRequest('PaymentMethodMapper: object is null or undefined');
        }

        const {
            _id,
            id,
            code,
            name,
            description,
            isActive,
            defaultOrderStatusId,
            requiresOnlinePayment,
            allowsManualConfirmation,
            createdAt,
            updatedAt
        } = object;

        if (!_id && !id) {
            throw CustomError.badRequest('PaymentMethodMapper: missing id');
        }

        return new PaymentMethodEntity(
            _id?.toString() || id?.toString(),
            code,
            name,
            description || '',
            isActive ?? true,
            defaultOrderStatusId,
            requiresOnlinePayment ?? false,
            allowsManualConfirmation ?? false,
            createdAt || new Date(),
            updatedAt || new Date()
        );
    } static fromEntityToObject(entity: PaymentMethodEntity): any {
        return {
            code: entity.code,
            name: entity.name,
            description: entity.description,
            isActive: entity.isActive,
            defaultOrderStatusId: entity.defaultOrderStatusId,
            requiresOnlinePayment: entity.requiresOnlinePayment,
            allowsManualConfirmation: entity.allowsManualConfirmation,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
}
