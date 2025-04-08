import { ProductEntity } from "../products/product.entity";

export class CartItemEntity {
    constructor(
        // No necesitamos un ID propio para el item embebido generalmente
        public product: ProductEntity, // Usamos la entidad completa para tener toda la info
        public quantity: number,
        public priceAtTime: number // Precio al momento de agregar al carrito
    ) { }

    // Calculamos el subtotal del item
    get subtotal(): number {
        return Math.round(this.quantity * this.priceAtTime * 100) / 100;
    }
}