import { AddItemToCartDto } from "../../dtos/cart/add-item-to-cart.dto";
import { UpdateCartItemDto } from "../../dtos/cart/update-cart-item.dto";
import { CartEntity } from "../../entities/cart/cart.entity";

// El repositorio a menudo refleja la estructura del datasource,
// pero podría añadir lógica o transformaciones adicionales si fuera necesario.
export abstract class CartRepository {

    abstract getCartByUserId(userId: string): Promise<CartEntity | null>;

    abstract addItem(userId: string, addItemDto: AddItemToCartDto): Promise<CartEntity>;

    abstract updateItemQuantity(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartEntity>;

    abstract removeItem(userId: string, productId: string): Promise<CartEntity>;

    abstract clearCart(userId: string): Promise<CartEntity>;
}