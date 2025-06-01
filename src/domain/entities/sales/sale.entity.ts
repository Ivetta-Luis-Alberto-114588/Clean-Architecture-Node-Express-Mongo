// src/domain/entities/sales/sale.entity.ts
import { CustomerEntity } from "../customers/customer";
import { ProductEntity } from "../products/product.entity";

export interface SaleItemEntity {
    product: ProductEntity;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export class SaleEntity {
    constructor(
        public id: string,
        public customer: CustomerEntity,
        public items: SaleItemEntity[],
        public subtotal: number,
        public taxRate: number,
        public taxAmount: number,
        public discountRate: number,
        public discountAmount: number,
        public total: number,
        public date: Date,
        public status: 'pending' | 'completed' | 'cancelled',
        public notes?: string,
    ) {}
}
