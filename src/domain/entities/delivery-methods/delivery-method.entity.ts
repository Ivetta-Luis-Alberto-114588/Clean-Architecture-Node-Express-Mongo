// src/domain/entities/delivery-methods/delivery-method.entity.ts

export class DeliveryMethodEntity {
    constructor(
        public readonly id: string,
        public readonly code: string,
        public readonly name: string,
        public readonly description?: string,
        public readonly requiresAddress: boolean = true,
        public readonly isActive: boolean = true,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date
    ) { }
}
