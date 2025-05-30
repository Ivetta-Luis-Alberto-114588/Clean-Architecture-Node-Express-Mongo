// src/domain/entities/order/order-status.entity.ts
export class OrderStatusEntity {
    constructor(
        public id: string,
        public code: string,
        public name: string,
        public description: string,
        public color: string,
        public order: number,
        public isActive: boolean,
        public isDefault: boolean,
        public canTransitionTo: string[] = [],
        public createdAt?: Date,
        public updatedAt?: Date
    ) { }

    public toString(): string {
        return `OrderStatus: ${this.code} - ${this.name}`;
    }
}
