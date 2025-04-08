import { CartItemEntity } from "../../../domain/entities/cart/cart-item.entity";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { ProductMapper } from "../products/product.mapper";
import logger from "../../../configs/logger"; // Importa tu logger

export class CartItemMapper {

    static fromObjectToCartItemEntity(object: { [key: string]: any }): CartItemEntity {
        const { productId, quantity, priceAtTime, productName } = object;

        // Validación básica
        if (!productId) throw CustomError.badRequest('CartItemMapper: missing productId');
        if (quantity === undefined) throw CustomError.badRequest('CartItemMapper: missing quantity');
        if (priceAtTime === undefined) throw CustomError.badRequest('CartItemMapper: missing priceAtTime');
        if (!productName) logger.warn(`CartItemMapper: missing productName for productId ${productId?._id || productId}`); // Advertencia si falta nombre

        let productEntity: ProductEntity;

        // Si productId es un objeto (poblado), mapearlo. Si no, crear placeholder.
        if (typeof productId === 'object' && productId !== null && (productId._id || productId.id)) {
            try {
                // Asegurarse de que el objeto tenga las propiedades mínimas esperadas por ProductMapper
                const productData = {
                    _id: productId._id || productId.id,
                    name: productId.name || productName || 'Producto Desconocido', // Usar productName si name falta
                    price: productId.price ?? priceAtTime ?? 0, // Usar priceAtTime si falta price
                    stock: productId.stock ?? 0,
                    category: productId.category || { id: 'unknown', name: 'Desconocida' }, // Placeholder
                    unit: productId.unit || { id: 'unknown', name: 'Desconocida' }, // Placeholder
                    imgUrl: productId.imgUrl || '',
                    isActive: productId.isActive ?? true,
                    description: productId.description || ''
                };
                productEntity = ProductMapper.fromObjectToProductEntity(productData);
            } catch (error) {
                logger.error("Error mapeando producto poblado en CartItemMapper:", { error, productId });
                // Crear placeholder si el mapeo falla
                productEntity = new ProductEntity(
                    productId._id?.toString() || productId.id?.toString() || 'unknown-id',
                    productId.name || productName || 'Producto Desconocido',
                    productId.price ?? priceAtTime ?? 0,
                    0, // stock
                    { id: 0, name: 'Desconocida', description: '', isActive: false }, // category placeholder
                    { id: 0, name: 'Desconocida', description: '', isActive: false }, // unit placeholder
                    '', true, ''
                );
            }

        } else {
            // Si solo tenemos el ID, crear placeholder
            const idString = typeof productId === 'string' ? productId : productId?.toString() ?? 'unknown-id';
            productEntity = new ProductEntity(
                idString,
                productName || 'Producto Desconocido', // Usar productName si está disponible
                priceAtTime ?? 0, // Usar el precio guardado
                0, // stock
                { id: 0, name: 'Desconocida', description: '', isActive: false }, // category placeholder
                { id: 0, name: 'Desconocida', description: '', isActive: false }, // unit placeholder
                '', true, ''
            );
        }

        return new CartItemEntity(
            productEntity,
            Number(quantity),
            Number(priceAtTime)
        );
    }
}