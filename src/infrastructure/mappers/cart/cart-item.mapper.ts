// src/infrastructure/mappers/cart/cart-item.mapper.ts (Backend - CORREGIDO)
import { CartItemEntity } from "../../../domain/entities/cart/cart-item.entity";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { ProductMapper } from "../products/product.mapper";
import logger from "../../../configs/logger";

export class CartItemMapper {

    static fromObjectToCartItemEntity(object: { [key: string]: any }): CartItemEntity {
        const { productId, quantity, priceAtTime, productName, taxRate } = object;

        // --- Validación básica (sin cambios) ---
        if (!productId) throw CustomError.badRequest('CartItemMapper: missing productId');
        if (quantity === undefined) throw CustomError.badRequest('CartItemMapper: missing quantity');
        if (priceAtTime === undefined) throw CustomError.badRequest('CartItemMapper: missing priceAtTime');
        if (!productName) logger.warn(`CartItemMapper: missing productName for productId ${productId?._id || productId}`);
        if (taxRate === undefined) throw CustomError.badRequest('CartItemMapper: missing taxRate');

        let productEntity: ProductEntity;
        // --- Lógica de mapeo de productEntity (sin cambios) ---
        if (typeof productId === 'object' && productId !== null && (productId._id || productId.id)) {
            try {
                const productData = { /* ... datos mínimos ... */
                    _id: productId._id || productId.id,
                    name: productId.name || productName || 'Producto Desconocido',
                    price: productId.price ?? priceAtTime ?? 0,
                    stock: productId.stock ?? 0,
                    category: productId.category || { id: 'unknown', name: 'Desconocida' },
                    unit: productId.unit || { id: 'unknown', name: 'Desconocida' },
                    imgUrl: productId.imgUrl || '',
                    isActive: productId.isActive ?? true,
                    description: productId.description || '',
                    taxRate: productId.taxRate ?? taxRate ?? 21
                };
                productEntity = ProductMapper.fromObjectToProductEntity(productData);
            } catch (error) { /* ... manejo error ... */
                logger.error("Error mapeando producto poblado en CartItemMapper:", { error, productId });
                productEntity = new ProductEntity(
                    productId._id?.toString() || productId.id?.toString() || 'unknown-id',
                    productId.name || productName || 'Producto Desconocido',
                    productId.price ?? priceAtTime ?? 0,
                    0, // stock
                    { id: 0, name: 'Desconocida', description: '', isActive: false }, // category placeholder
                    { id: 0, name: 'Desconocida', description: '', isActive: false }, // unit placeholder
                    '', true, '',
                    taxRate ?? 21 // <<<--- Usar el taxRate guardado o default
                );
            }
        } else { /* ... placeholder ... */
            const idString = typeof productId === 'string' ? productId : productId?.toString() ?? 'unknown-id';
            productEntity = new ProductEntity(idString, productName || 'Producto Desconocido', priceAtTime ?? 0, 0, { id: 0, name: 'Desconocida', description: '', isActive: false }, { id: 0, name: 'Desconocida', description: '', isActive: false }, '', true, '', taxRate ?? 21);
        }
        // --- Fin Lógica de mapeo de productEntity ---


        const q = Number(quantity);
        const price = Number(priceAtTime); // Este es el precio SIN IVA
        const rate = Number(taxRate);

        // --- ¡¡CALCULAR VALORES PARA ESTE ITEM!! ---
        const unitPriceWithTax = Math.round(price * (1 + rate / 100) * 100) / 100;
        const subtotalWithTax = Math.round(q * unitPriceWithTax * 100) / 100;
        // --- FIN CÁLCULOS ---

        return new CartItemEntity(
            productEntity,
            q,
            price, // precio SIN iva guardado
            rate,  // tasa de iva guardada
            // --- ¡¡PASAR VALORES CALCULADOS AL CONSTRUCTOR!! ---
            unitPriceWithTax,
            subtotalWithTax
        );
    }
}


