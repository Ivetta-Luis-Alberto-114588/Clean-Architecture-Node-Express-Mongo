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

    // Calculamos el total del carrito
    get total(): number {
        return Math.round(this.items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100;
    }

    // Calculamos la cantidad total de items
    get totalItems(): number {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }
}