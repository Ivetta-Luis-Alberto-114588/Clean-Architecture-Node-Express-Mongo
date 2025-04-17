import { ProductEntity } from "../products/product.entity";

export class CartItemEntity {
    constructor(
        // No necesitamos un ID propio para el item embebido generalmente
        public product: ProductEntity, // Usamos la entidad completa para tener toda la info
        public quantity: number,
        public priceAtTime: number,
        public taxRate: number, // Precio al momento de agregar al carrito
        public unitPriceWithTax: number, // Precio unitario CON IVA (calculado)
        public subtotalWithTax: number   // Subtotal CON IVA (calculado)
    ) { }

    // Calculamos el subtotal del item
    get subtotal(): number {
        return this.subtotalWithTax;
    }

    // Precio unitario CON IVA
    // get unitPriceWithTax(): number {
    //     return Math.round(this.priceAtTime * (1 + this.taxRate / 100) * 100) / 100;
    // }

    // Subtotal CON IVA para este item
    // get subtotalWithTax(): number {
    //     return Math.round(this.quantity * this.unitPriceWithTax * 100) / 100;
    // }
}