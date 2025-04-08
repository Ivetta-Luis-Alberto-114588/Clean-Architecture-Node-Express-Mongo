import { AddItemToCartDto } from "../../dtos/cart/add-item-to-cart.dto";
import { UpdateCartItemDto } from "../../dtos/cart/update-cart-item.dto";
import { CartEntity } from "../../entities/cart/cart.entity";

export abstract class CartDatasource {

    abstract getCartByUserId(userId: string): Promise<CartEntity | null>;

    // Busca o crea un carrito para el usuario
    abstract findOrCreateCart(userId: string): Promise<CartEntity>;

    // Agrega o actualiza la cantidad de un item
    abstract addItem(userId: string, addItemDto: AddItemToCartDto): Promise<CartEntity>;

    // Actualiza directamente la cantidad de un item (o lo elimina si es 0)
    abstract updateItemQuantity(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartEntity>;

    // Elimina un item específico del carrito
    abstract removeItem(userId: string, productId: string): Promise<CartEntity>;

    // Vacía el carrito
    abstract clearCart(userId: string): Promise<CartEntity>;

}