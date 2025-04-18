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
        // ... (desestructuración y validaciones id, items, etc.)
        const { _id, id, userId, items = [], createdAt, updatedAt } = object;

        if (!_id && !id) throw CustomError.badRequest('CartMapper: missing id');
        if (!userId) throw CustomError.badRequest('CartMapper: missing userId');

        let userEntity: UserEntity;
        // --- Lógica de mapeo de usuario AJUSTADA ---
        if (typeof userId === 'object' && userId !== null && (userId._id || userId.id)) {
            // Mapear solo los campos necesarios directamente, sin UserMapper
            const userIdStr = userId._id?.toString() || userId.id?.toString();
            if (!userIdStr) throw CustomError.internalServerError('CartMapper: ID de usuario poblado inválido');
            userEntity = new UserEntity(
                userIdStr,
                userId.name || 'Usuario Desconocido',
                userId.email || 'desconocido@dominio.com',
                '******', // Placeholder para password
                userId.roles || ['USER_ROLE'],
                userId.img
            );
        } else {
            // ... (lógica para placeholder si userId no es objeto)
            const userIdString = typeof userId === 'string' ? userId : userId?.toString() ?? 'unknown-user-id';
            userEntity = new UserEntity(userIdString, 'Usuario (No Poblado)', 'no-poblado@dominio.com', '********', ['USER_ROLE']);
        }
        // --- Fin Lógica de mapeo de usuario AJUSTADA ---

        // ... (mapeo de items y cálculo de totales)
        const cartItems: CartItemEntity[] = items.map((item: any) => {
            try {
                return CartItemMapper.fromObjectToCartItemEntity(item);
            } catch (error) {
                logger.error("Error mapeando CartItem en CartMapper:", { error, item });
                return null;
            }
        }).filter((item: CartItemEntity | null): item is CartItemEntity => item !== null);

        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotalWithoutTax = Math.round(cartItems.reduce((sum, item) => sum + (item.quantity * item.priceAtTime), 0) * 100) / 100;
        const totalWithTax = Math.round(cartItems.reduce((sum, item) => sum + item.subtotalWithTax, 0) * 100) / 100;
        const totalTaxAmount = Math.round((totalWithTax - subtotalWithoutTax) * 100) / 100;


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
            totalWithTax
        );
    }
}