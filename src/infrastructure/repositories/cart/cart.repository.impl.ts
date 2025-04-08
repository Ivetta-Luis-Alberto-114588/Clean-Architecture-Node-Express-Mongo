import { CartDatasource } from "../../../domain/datasources/cart/cart.datasource";
import { AddItemToCartDto } from "../../../domain/dtos/cart/add-item-to-cart.dto";
import { UpdateCartItemDto } from "../../../domain/dtos/cart/update-cart-item.dto";
import { CartEntity } from "../../../domain/entities/cart/cart.entity";
import { CartRepository } from "../../../domain/repositories/cart/cart.repository";

export class CartRepositoryImpl implements CartRepository {

    constructor(
        private readonly cartDatasource: CartDatasource
    ) { }

    getCartByUserId(userId: string): Promise<CartEntity | null> {
        return this.cartDatasource.getCartByUserId(userId);
    }

    addItem(userId: string, addItemDto: AddItemToCartDto): Promise<CartEntity> {
        return this.cartDatasource.addItem(userId, addItemDto);
    }

    updateItemQuantity(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartEntity> {
        return this.cartDatasource.updateItemQuantity(userId, updateCartItemDto);
    }

    removeItem(userId: string, productId: string): Promise<CartEntity> {
        return this.cartDatasource.removeItem(userId, productId);
    }

    clearCart(userId: string): Promise<CartEntity> {
        return this.cartDatasource.clearCart(userId);
    }
}