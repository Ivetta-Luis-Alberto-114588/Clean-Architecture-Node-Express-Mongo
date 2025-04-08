import { CustomerEntity } from "../customers/customer";
import { ProductEntity } from "../products/product.entity";

export interface OrderItemEntity {
    product: ProductEntity; // Podría ser solo el ID si no necesitas toda la info aquí
    quantity: number;
    unitPrice: number; // <<<--- AHORA ES PRECIO UNITARIO CON IVA
    subtotal: number;  // <<<--- AHORA ES SUBTOTAL CON IVA (quantity * unitPrice)
    // Opcional: podrías guardar la tasa aplicada si varía mucho
    // taxRateApplied?: number;
}

export class OrderEntity {
    constructor(
        public id: string,
        public customer: CustomerEntity,
        public items: OrderItemEntity[],
        public subtotal: number,    // Suma de subtotales de items (ya con IVA)
        public taxRate: number,     // Tasa general aplicada (¿quizás ya no tan útil o para impuestos adicionales?)
        public taxAmount: number,   // Suma del IVA de todos los items
        public discountRate: number, // Descuento sobre el subtotal CON IVA
        public discountAmount: number, // Monto del descuento
        public total: number,        // Total final a pagar
        public date: Date,
        public status: 'pending' | 'completed' | 'cancelled',
        public notes?: string,
    ) { }

    // Opcional: Calcular subtotal base (sin IVA) si es necesario mostrarlo
    get subtotalWithoutTax(): number {
        return Math.round(this.items.reduce((sum, item) => {
            // Necesitamos la tasa original del producto para revertir el cálculo
            // Esto requiere que 'product' en SaleItemEntity esté poblado o guardar la tasa en el item
            const originalTaxRate = item.product?.taxRate ?? 21; // Asumir 21 si no está poblado
            const basePrice = item.unitPrice / (1 + originalTaxRate / 100);
            return sum + (item.quantity * basePrice);
        }, 0) * 100) / 100;
    }
}