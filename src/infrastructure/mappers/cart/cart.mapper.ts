import { CartEntity } from "../../../domain/entities/cart/cart.entity";
import { UserEntity } from "../../../domain/entities/user.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { UserMapper } from "../user.mapper";
import { CartItemMapper } from "./cart-item.mapper";
import logger from "../../../configs/logger"; // Importa tu logger
import { CartItemEntity } from "../../../domain/entities/cart/cart-item.entity";

export class CartMapper {

    static fromObjectToCartEntity(object: { [key: string]: any }): CartEntity {
        const { _id, id, userId, items = [], createdAt, updatedAt } = object;

        if (!_id && !id) throw CustomError.badRequest('CartMapper: missing id');
        if (!userId) throw CustomError.badRequest('CartMapper: missing userId');

        let userEntity: UserEntity;
        // Mapear usuario si está poblado
        if (typeof userId === 'object' && userId !== null && (userId._id || userId.id)) {
            try {
                // Asegurar que tenga las propiedades mínimas para el UserMapper
                const userData = {
                    _id: userId._id || userId.id,
                    name: userId.name || 'Usuario Desconocido',
                    email: userId.email || 'desconocido@dominio.com',
                    password: userId.password || '********', // No exponer contraseña real
                    roles: userId.roles || ['USER_ROLE']
                };
                userEntity = UserMapper.fromObjectToUserEntity(userData);
            } catch (error) {
                logger.error("Error mapeando usuario poblado en CartMapper:", { error, userId });
                // Crear placeholder si falla
                userEntity = new UserEntity(
                    userId._id?.toString() || userId.id?.toString() || 'unknown-user-id',
                    'Usuario Desconocido', 'error@dominio.com', '********', ['USER_ROLE']
                );
            }

        } else {
            // Si solo tenemos el ID, crear placeholder
            const userIdString = typeof userId === 'string' ? userId : userId?.toString() ?? 'unknown-user-id';
            userEntity = new UserEntity(userIdString, 'Usuario (No Poblado)', 'no-poblado@dominio.com', '********', ['USER_ROLE']);
        }

        // Mapear items
        const cartItems = items.map((item: any) => {
            try {
                return CartItemMapper.fromObjectToCartItemEntity(item);
            } catch (error) {
                logger.error("Error mapeando CartItem en CartMapper:", { error, item });
                // Podríamos decidir omitir el item erróneo o lanzar un error general
                // Omitir por ahora para que el carrito se cargue parcialmente si un item está corrupto
                return null;
            }
        }).filter((item: CartItemEntity | null): item is CartItemEntity => item !== null); // Filtrar nulos


        return new CartEntity(
            _id?.toString() || id?.toString(),
            userEntity.id, // Usamos el ID de la entidad mapeada/placeholder
            userEntity,    // Pasamos la entidad mapeada/placeholder
            cartItems,
            new Date(createdAt),
            new Date(updatedAt)
        );
    }
}