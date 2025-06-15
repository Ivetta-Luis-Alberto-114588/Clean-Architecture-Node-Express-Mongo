// src/domain/entities/order/order.entity.ts
import { CustomerEntity } from "../customers/customer";
import { ProductEntity } from "../products/product.entity";
import { OrderStatusEntity } from "./order-status.entity";
import { PaymentMethodEntity } from "../payment/payment-method.entity";

export interface OrderItemEntity {
    product: ProductEntity;
    quantity: number;
    unitPrice: number; // CON IVA
    subtotal: number;  // CON IVA
}

// <<<--- NUEVA INTERFAZ --- >>>
export interface ShippingDetailsEntity {
    recipientName: string;
    phone: string;
    streetAddress: string;
    postalCode?: string;
    neighborhoodName: string;
    cityName: string;
    additionalInfo?: string;
    // Los IDs originales no son estrictamente necesarios en la entidad principal,
    // pero podrías añadirlos si son útiles para la lógica de negocio posterior.
    // originalAddressId?: string;
    // originalNeighborhoodId?: string;
    // originalCityId?: string;
}
// <<<--- FIN NUEVA INTERFAZ --- >>>


export class OrderEntity {
    constructor(
        public id: string,
        public customer: CustomerEntity,
        public items: OrderItemEntity[],
        public subtotal: number,
        public taxRate: number, // Podría eliminarse
        public taxAmount: number,
        public discountRate: number,
        public discountAmount: number,
        public total: number, public date: Date,
        public status: OrderStatusEntity,
        public paymentMethod?: PaymentMethodEntity,
        public notes?: string,
        public shippingDetails?: ShippingDetailsEntity // <<<--- ACTUALIZADO
    ) { }

    // ... (get subtotalWithoutTax existente) ...
    get subtotalWithoutTax(): number {
        return Math.round(this.items.reduce((sum, item) => {
            const originalTaxRate = item.product?.taxRate ?? 21;
            const basePrice = item.unitPrice / (1 + originalTaxRate / 100);
            return sum + (item.quantity * basePrice);
        }, 0) * 100) / 100;
    }
}