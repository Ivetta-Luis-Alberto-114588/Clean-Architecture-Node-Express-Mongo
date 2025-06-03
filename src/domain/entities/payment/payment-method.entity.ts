// src/domain/entities/payment/payment-method.entity.ts

export class PaymentMethodEntity {
    constructor(
        public readonly id: string,
        public readonly code: string,
        public readonly name: string,
        public readonly description: string,
        public readonly isActive: boolean,
        public readonly defaultOrderStatusId: string,
        public readonly requiresOnlinePayment: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    static fromObject(object: { [key: string]: any }): PaymentMethodEntity {
        const { id, _id, code, name, description, isActive, defaultOrderStatusId, requiresOnlinePayment, createdAt, updatedAt } = object;

        return new PaymentMethodEntity(
            id || _id,
            code,
            name,
            description,
            isActive,
            defaultOrderStatusId,
            requiresOnlinePayment,
            createdAt,
            updatedAt
        );
    }
}
