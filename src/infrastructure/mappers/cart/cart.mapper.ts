// src/infrastructure/mappers/cart/cart.mapper.ts (Backend - CORREGIDO)
import { CartEntity } from "../../../domain/entities/cart/cart.entity";
import { UserEntity } from "../../../domain/entities/user.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { UserMapper } from "../user.mapper";
import { CartItemMapper } from "./cart-item.mapper";
import logger from "../../../configs/logger";
import { CartItemEntity } from "../../../domain/entities/cart/cart-item.entity";

export class CartMapper {

    static fromObjectToCartEntity(object: { [key: string]: any }): CartEntity {
        const { _id, id, userId, items = [], createdAt, updatedAt } = object;

        if (!_id && !id) throw CustomError.badRequest('CartMapper: missing id');
        if (!userId) throw CustomError.badRequest('CartMapper: missing userId');

        let userEntity: UserEntity;
        // --- Lógica de mapeo de usuario (sin cambios) ---
        if (typeof userId === 'object' && userId !== null && (userId._id || userId.id)) {
            try {
                const userData = { /* ... datos mínimos ... */
                    _id: userId._id || userId.id,
                    name: userId.name || 'Usuario Desconocido',
                    email: userId.email || 'desconocido@dominio.com',
                    password: userId.password || '********', // No exponer contraseña real
                    roles: userId.roles || ['USER_ROLE']
                };
                userEntity = UserMapper.fromObjectToUserEntity(userData);
            } catch (error) {
                logger.error("Error mapeando usuario poblado en CartMapper:", { error, userId });
                userEntity = new UserEntity(userId._id?.toString() || userId.id?.toString() || 'unknown-user-id', 'Usuario Desconocido', 'error@dominio.com', '********', ['USER_ROLE']);
            }
        } else {
            const userIdString = typeof userId === 'string' ? userId : userId?.toString() ?? 'unknown-user-id';
            userEntity = new UserEntity(userIdString, 'Usuario (No Poblado)', 'no-poblado@dominio.com', '********', ['USER_ROLE']);
        }
        // --- Fin Lógica de mapeo de usuario ---


        const cartItems: CartItemEntity[] = items.map((item: any) => {
            try {
                return CartItemMapper.fromObjectToCartItemEntity(item);
            } catch (error) {
                logger.error("Error mapeando CartItem en CartMapper:", { error, item });
                return null;
            }
        }).filter((item: CartItemEntity | null): item is CartItemEntity => item !== null);

        // --- ¡¡CALCULAR VALORES AQUÍ!! ---
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotalWithoutTax = Math.round(cartItems.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0) * 100) / 100;
        const totalWithTax = Math.round(cartItems.reduce((sum, item) => sum + item.subtotalWithTax, 0) * 100) / 100;
        const totalTaxAmount = Math.round((totalWithTax - subtotalWithoutTax) * 100) / 100;
        // --- FIN CÁLCULOS ---

        return new CartEntity(
            _id?.toString() || id?.toString(),
            userEntity.id,
            userEntity,
            cartItems,
            new Date(createdAt),
            new Date(updatedAt),
            totalItems,
            subtotalWithoutTax,
            totalTaxAmount,
            totalWithTax // Este es el 'total' final
        );
    }
}