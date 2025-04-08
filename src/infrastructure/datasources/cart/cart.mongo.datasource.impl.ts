import mongoose from "mongoose";
import { CartModel } from "../../../data/mongodb/models/cart/cart.model";
import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { UserModel } from "../../../data/mongodb/models/user.model";
import { CartDatasource } from "../../../domain/datasources/cart/cart.datasource";
import { AddItemToCartDto } from "../../../domain/dtos/cart/add-item-to-cart.dto";
import { UpdateCartItemDto } from "../../../domain/dtos/cart/update-cart-item.dto";
import { CartEntity } from "../../../domain/entities/cart/cart.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CartMapper } from "../../mappers/cart/cart.mapper";
import logger from "../../../configs/logger";

export class CartMongoDataSourceImpl implements CartDatasource {

    private async getPopulatedCart(cartId: mongoose.Types.ObjectId): Promise<CartEntity | null> {
        const cart = await CartModel.findById(cartId)
            .populate('userId')
            // Populamos el producto referenciado DENTRO de cada item del array 'items'
            .populate({
                path: 'items.productId', // La ruta dentro del array
                model: 'Product',       // El modelo a usar para popular
                populate: [             // Populaciones anidadas dentro del producto
                    { path: 'category', model: 'Category' },
                    { path: 'unit', model: 'Unit' }
                ]
            });

        if (!cart) return null;
        return CartMapper.fromObjectToCartEntity(cart);
    }

    // ... findOrCreateCart y getCartByUserId (sin cambios aquí, dependen de getPopulatedCart) ...
    async findOrCreateCart(userId: string): Promise<CartEntity> {
        try {
            let cart = await CartModel.findOne({ userId });

            if (!cart) {
                logger.info(`Creando carrito para usuario ${userId}`);
                const userExists = await UserModel.findById(userId);
                if (!userExists) {
                    throw CustomError.notFound(`Usuario con ID ${userId} no encontrado al intentar crear carrito.`);
                }
                cart = await CartModel.create({ userId, items: [] });
            }

            const populatedCart = await this.getPopulatedCart(cart._id);
            if (!populatedCart) {
                throw CustomError.internalServerError("Error al obtener el carrito después de buscar/crear.");
            }
            return populatedCart;

        } catch (error) {
            logger.error(`Error en findOrCreateCart para usuario ${userId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al buscar o crear el carrito.");
        }
    }

    async getCartByUserId(userId: string): Promise<CartEntity | null> {
        try {
            const cart = await CartModel.findOne({ userId });
            if (!cart) {
                logger.info(`Carrito no encontrado para usuario ${userId}, devolviendo null.`);
                return null;
            }
            // Usar el helper getPopulatedCart que ya incluye la población anidada
            return await this.getPopulatedCart(cart._id);
        } catch (error) {
            logger.error(`Error en getCartByUserId para usuario ${userId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al obtener el carrito.");
        }
    }


    async addItem(userId: string, addItemDto: AddItemToCartDto): Promise<CartEntity> {
        const { productId, quantity } = addItemDto;

        try {
            const product = await ProductModel.findById(productId);
            if (!product) throw CustomError.notFound(`Producto con ID ${productId} no encontrado.`);
            if (!product.isActive) throw CustomError.badRequest(`Producto '${product.name}' no disponible.`);

            const cart = await CartModel.findOne({ userId });
            if (!cart) {
                const userExists = await UserModel.findById(userId);
                if (!userExists) throw CustomError.notFound(`Usuario con ID ${userId} no encontrado.`);

                const newCart = await CartModel.create({
                    userId,
                    items: [{
                        productId,
                        quantity,
                        priceAtTime: product.price, // <<<--- Precio SIN IVA
                        taxRate: product.taxRate,   // <<<--- Tasa del producto
                        productName: product.name,
                    }]
                });
                logger.info(`Nuevo carrito creado y item añadido para usuario ${userId}`);
                const populatedCart = await this.getPopulatedCart(newCart._id); // Re-poblar
                if (!populatedCart) throw CustomError.internalServerError("Error al poblar carrito recién creado.");
                return populatedCart;
            }

            const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += quantity;
                // Opcional: si quisiéramos actualizar el precio/tasa al último valor del producto
                // cart.items[existingItemIndex].priceAtTime = product.price;
                // cart.items[existingItemIndex].taxRate = product.taxRate;
                // cart.items[existingItemIndex].productName = product.name;
                logger.debug(`Cantidad actualizada para producto ${productId} en carrito de ${userId}`);
            } else {
                cart.items.push({
                    productId: new mongoose.Types.ObjectId(productId),
                    quantity,
                    priceAtTime: product.price, // <<<--- Precio SIN IVA
                    taxRate: product.taxRate,   // <<<--- Tasa del producto
                    productName: product.name,
                });
                logger.debug(`Nuevo producto ${productId} añadido a carrito de ${userId}`);
            }

            await cart.save();
            const populatedCart = await this.getPopulatedCart(cart._id);
            if (!populatedCart) throw CustomError.internalServerError("Error al obtener el carrito actualizado.");
            return populatedCart;

        } catch (error) {
            logger.error(`Error en addItem para usuario ${userId}, producto ${productId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al añadir item al carrito.");
        }
    }

    // ... updateItemQuantity, removeItem, clearCart (no necesitan cambios en su lógica principal, pero se benefician de getPopulatedCart) ...
    async updateItemQuantity(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartEntity> {
        const { productId, quantity } = updateCartItemDto;

        try {
            const cart = await CartModel.findOne({ userId });
            if (!cart) throw CustomError.notFound(`Carrito no encontrado para el usuario ${userId}.`);

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex === -1) throw CustomError.notFound(`Producto ${productId} no encontrado en el carrito.`);

            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
                logger.debug(`Producto ${productId} eliminado de carrito ${userId} por cantidad 0`);
            } else {
                // Opcional: Verificar stock aquí si es necesario
                // const product = await ProductModel.findById(productId);
                // if (!product) throw CustomError.notFound(...);
                // if (product.stock < quantity) throw CustomError.badRequest(...);

                cart.items[itemIndex].quantity = quantity;
                // Opcional: Actualizar precio/tasa/nombre si es necesario
                // cart.items[itemIndex].priceAtTime = product.price;
                // cart.items[itemIndex].taxRate = product.taxRate;
                // cart.items[itemIndex].productName = product.name;
                logger.debug(`Cantidad de producto ${productId} actualizada a ${quantity} en carrito ${userId}`);
            }

            await cart.save();
            const populatedCart = await this.getPopulatedCart(cart._id);
            if (!populatedCart) throw CustomError.internalServerError("Error al obtener el carrito actualizado.");
            return populatedCart;

        } catch (error) {
            logger.error(`Error en updateItemQuantity para usuario ${userId}, producto ${productId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al actualizar la cantidad del item.");
        }
    }

    async removeItem(userId: string, productId: string): Promise<CartEntity> {
        try {
            const updatedCartDoc = await CartModel.findOneAndUpdate(
                { userId },
                { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } },
                { new: true }
            );

            if (!updatedCartDoc) {
                const cartExists = await CartModel.findOne({ userId });
                if (!cartExists) throw CustomError.notFound(`Carrito no encontrado para el usuario ${userId}.`);
                logger.warn(`Intento de eliminar producto ${productId} que no estaba en carrito de ${userId}`);
                const currentCart = await this.getPopulatedCart(cartExists._id); // Usar helper
                if (!currentCart) throw CustomError.internalServerError("Error al obtener carrito actual tras intento de eliminación fallido.");
                return currentCart;
            }
            logger.debug(`Producto ${productId} eliminado de carrito ${userId}`);

            const populatedCart = await this.getPopulatedCart(updatedCartDoc._id); // Usar helper
            if (!populatedCart) throw CustomError.internalServerError("Error al obtener el carrito actualizado tras eliminar item.");
            return populatedCart;

        } catch (error) {
            logger.error(`Error en removeItem para usuario ${userId}, producto ${productId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al eliminar item del carrito.");
        }
    }

    async clearCart(userId: string): Promise<CartEntity> {
        try {
            const updatedCartDoc = await CartModel.findOneAndUpdate(
                { userId },
                { $set: { items: [] } },
                { new: true }
            );

            if (!updatedCartDoc) {
                throw CustomError.notFound(`Carrito no encontrado para el usuario ${userId} al intentar vaciarlo.`);
            }
            logger.info(`Carrito vaciado para usuario ${userId}`);

            const populatedCart = await this.getPopulatedCart(updatedCartDoc._id); // Usar helper
            if (!populatedCart) throw CustomError.internalServerError("Error al obtener el carrito vacío actualizado.");
            return populatedCart;

        } catch (error) {
            logger.error(`Error en clearCart para usuario ${userId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al vaciar el carrito.");
        }
    }
}