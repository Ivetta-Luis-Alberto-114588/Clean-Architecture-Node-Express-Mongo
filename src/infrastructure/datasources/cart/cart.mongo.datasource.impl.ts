import mongoose from "mongoose";
import { CartModel } from "../../../data/mongodb/models/cart/cart.model";
import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { UserModel } from "../../../data/mongodb/models/user.model";
import { CartDatasource } from "../../../domain/datasources/cart/cart.datasource";
import { AddItemToCartDto } from "../../../domain/dtos/cart/add-item-to-cart.dto";
import { UpdateCartItemDto } from "../../../domain/dtos/cart/update-cart-item.dto";
import { CartEntity } from "../../../domain/entities/cart/cart.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import logger from "../../../configs/logger"; // Importa tu logger
import { CartMapper } from "../../mappers/cart/cart.mapper";

export class CartMongoDataSourceImpl implements CartDatasource {

    // Helper para popular y mapear
    private async getPopulatedCart(cartId: mongoose.Types.ObjectId): Promise<CartEntity | null> {
        const cart = await CartModel.findById(cartId)
            .populate('userId') // Popula el usuario
            .populate('items.productId'); // Popula los productos dentro de los items

        if (!cart) return null;
        return CartMapper.fromObjectToCartEntity(cart);
    }

    async findOrCreateCart(userId: string): Promise<CartEntity> {
        try {
            let cart = await CartModel.findOne({ userId });

            if (!cart) {
                logger.info(`Creando carrito para usuario ${userId}`);
                // Validar que el usuario exista antes de crear el carrito
                const userExists = await UserModel.findById(userId);
                if (!userExists) {
                    throw CustomError.notFound(`Usuario con ID ${userId} no encontrado al intentar crear carrito.`);
                }
                cart = await CartModel.create({ userId, items: [] });
            }

            // Siempre devolvemos el carrito poblado
            const populatedCart = await this.getPopulatedCart(cart._id);
            if (!populatedCart) {
                // Esto no debería pasar si acabamos de crearlo o encontrarlo
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
                return null; // Es válido que un usuario no tenga carrito aún
            }
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
            // 1. Buscar el producto para obtener precio y nombre actuales
            const product = await ProductModel.findById(productId);
            if (!product) throw CustomError.notFound(`Producto con ID ${productId} no encontrado.`);
            if (!product.isActive) throw CustomError.badRequest(`Producto '${product.name}' no disponible.`);
            // Podríamos re-verificar stock aquí si la lógica de negocio lo requiere
            // if (product.stock < quantity) throw CustomError.badRequest(`Stock insuficiente...`);

            // 2. Buscar o crear el carrito del usuario
            const cart = await CartModel.findOne({ userId });
            if (!cart) {
                // Si no existe, lo creamos
                const userExists = await UserModel.findById(userId);
                if (!userExists) throw CustomError.notFound(`Usuario con ID ${userId} no encontrado.`);

                const newCart = await CartModel.create({
                    userId,
                    items: [{
                        productId,
                        quantity,
                        priceAtTime: product.price,
                        productName: product.name,
                    }]
                });
                logger.info(`Nuevo carrito creado y item añadido para usuario ${userId}`);

                // Obtener el carrito poblado
                const populatedCart = await this.getPopulatedCart(newCart._id);
                if (!populatedCart) {
                    // Si no se puede obtener el carrito poblado, lanzar un error
                    throw CustomError.internalServerError("Error al obtener el carrito poblado tras creación.");
                }
                return populatedCart;
            }


            // 3. Si el carrito existe, buscar si el item ya está
            const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (existingItemIndex > -1) {
                // Si existe, actualizar cantidad y quizás el precio/nombre si la lógica lo requiere
                // Por ahora, solo actualizamos cantidad. Mantenemos el precio original.
                cart.items[existingItemIndex].quantity += quantity;
                // Opcional: actualizar precio si cambia
                // cart.items[existingItemIndex].priceAtTime = product.price;
                // cart.items[existingItemIndex].productName = product.name;
                logger.debug(`Cantidad actualizada para producto ${productId} en carrito de ${userId}`);

            } else {
                // Si no existe, añadirlo
                cart.items.push({
                    productId: new mongoose.Types.ObjectId(productId),
                    quantity,
                    priceAtTime: product.price,
                    productName: product.name,
                });
                logger.debug(`Nuevo producto ${productId} añadido a carrito de ${userId}`);
            }

            // 4. Guardar cambios y devolver carrito poblado
            await cart.save();
            const populatedCart = await this.getPopulatedCart(cart._id);
            if (!populatedCart) {
                throw CustomError.internalServerError("Error al obtener el carrito actualizado.");
            }
            return populatedCart;

        } catch (error) {
            logger.error(`Error en addItem para usuario ${userId}, producto ${productId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al añadir item al carrito.");
        }
    }

    async updateItemQuantity(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartEntity> {
        const { productId, quantity } = updateCartItemDto;

        try {
            const cart = await CartModel.findOne({ userId });
            if (!cart) throw CustomError.notFound(`Carrito no encontrado para el usuario ${userId}.`);

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex === -1) throw CustomError.notFound(`Producto ${productId} no encontrado en el carrito.`);

            if (quantity <= 0) {
                // Si la cantidad es 0 o menor, eliminar el item
                cart.items.splice(itemIndex, 1);
                logger.debug(`Producto ${productId} eliminado de carrito ${userId} por cantidad 0`);
            } else {
                // Verificar stock si es necesario (opcional, como en addItem)
                // const product = await ProductModel.findById(productId);
                // if (!product) throw CustomError.notFound(`Producto asociado ${productId} no encontrado.`);
                // if (product.stock < quantity) throw CustomError.badRequest(`Stock insuficiente...`);

                // Actualizar cantidad
                cart.items[itemIndex].quantity = quantity;
                logger.debug(`Cantidad de producto ${productId} actualizada a ${quantity} en carrito ${userId}`);
                // Opcional: actualizar precio/nombre si la lógica lo requiere
                // cart.items[itemIndex].priceAtTime = product.price;
                // cart.items[itemIndex].productName = product.name;
            }

            await cart.save();
            const populatedCart = await this.getPopulatedCart(cart._id);
            if (!populatedCart) {
                throw CustomError.internalServerError("Error al obtener el carrito actualizado.");
            }
            return populatedCart;

        } catch (error) {
            logger.error(`Error en updateItemQuantity para usuario ${userId}, producto ${productId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al actualizar la cantidad del item.");
        }
    }

    async removeItem(userId: string, productId: string): Promise<CartEntity> {
        try {
            // Usamos findOneAndUpdate para buscar y modificar atómicamente
            const updatedCartDoc = await CartModel.findOneAndUpdate(
                { userId }, // Condición de búsqueda
                { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } }, // Operación: quitar el item
                { new: true } // Opción: devolver el documento modificado
            );

            if (!updatedCartDoc) {
                // Puede que el carrito no exista, o que el item no estuviera.
                // Verificamos si el carrito existe para dar un error más preciso.
                const cartExists = await CartModel.findOne({ userId });
                if (!cartExists) throw CustomError.notFound(`Carrito no encontrado para el usuario ${userId}.`);
                // Si el carrito existe pero no se modificó, el item no estaba. Aún así, devolvemos el carrito actual.
                logger.warn(`Intento de eliminar producto ${productId} que no estaba en carrito de ${userId}`);
                const currentCart = await this.getPopulatedCart(cartExists._id);
                if (!currentCart) throw CustomError.internalServerError("Error al obtener carrito actual tras intento de eliminación fallido.");
                return currentCart;
            }
            logger.debug(`Producto ${productId} eliminado de carrito ${userId}`);

            // Devolver carrito poblado
            const populatedCart = await this.getPopulatedCart(updatedCartDoc._id);
            if (!populatedCart) {
                throw CustomError.internalServerError("Error al obtener el carrito actualizado tras eliminar item.");
            }
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
                { $set: { items: [] } }, // Vaciar el array de items
                { new: true }
            );

            if (!updatedCartDoc) {
                // Si no se encuentra el carrito, podríamos crearlo vacío o lanzar error
                // Optamos por lanzar error si no existe, ya que "clear" implica que había algo.
                throw CustomError.notFound(`Carrito no encontrado para el usuario ${userId} al intentar vaciarlo.`);
            }
            logger.info(`Carrito vaciado para usuario ${userId}`);

            // Devolver carrito poblado (ahora vacío)
            const populatedCart = await this.getPopulatedCart(updatedCartDoc._id);
            if (!populatedCart) {
                throw CustomError.internalServerError("Error al obtener el carrito vacío actualizado.");
            }
            return populatedCart;

        } catch (error) {
            logger.error(`Error en clearCart para usuario ${userId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al vaciar el carrito.");
        }
    }
}