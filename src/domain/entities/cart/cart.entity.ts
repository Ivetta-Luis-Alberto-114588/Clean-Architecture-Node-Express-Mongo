import { UserEntity } from "../user.entity";
import { CartItemEntity } from "./cart-item.entity";

export class CartEntity {
    constructor(
        public id: string,
        public userId: string, // ID del usuario dueño del carrito
        public user: UserEntity, // Opcional: entidad de usuario poblada
        public items: CartItemEntity[],
        public createdAt: Date,
        public updatedAt: Date,
    ) { }

    // Total del carrito (suma de subtotales CON IVA)
    get total(): number {
        return Math.round(this.items.reduce((sum, item) => sum + item.subtotalWithTax, 0) * 100) / 100;
    }

    // Cantidad total de items (no cambia)
    get totalItems(): number {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Calcular el total de IVA del carrito
    get totalTaxAmount(): number {
        const totalWithoutTax = this.items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0);
        const totalWithTax = this.total; // Ya calculado
        return Math.round((totalWithTax - totalWithoutTax) * 100) / 100;
    }

    // Subtotal SIN IVA (base imponible total)
    get subtotalWithoutTax(): number {
        return Math.round(this.items.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0) * 100) / 100;
    }
}