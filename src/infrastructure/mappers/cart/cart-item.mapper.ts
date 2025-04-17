// src/infrastructure/mappers/cart/cart-item.mapper.ts (Backend - Completo y Corregido)

import { CartItemEntity } from "../../../domain/entities/cart/cart-item.entity";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { ProductMapper } from "../products/product.mapper"; // Necesario para mapear el producto poblado
import logger from "../../../configs/logger";
// Importar entidades placeholder si ProductMapper no las maneja internamente
import { CategoryEntity } from "../../../domain/entities/products/category.entity";
import { UnitEntity } from "../../../domain/entities/products/unit.entity";

export class CartItemMapper {

    static fromObjectToCartItemEntity(object: { [key: string]: any }): CartItemEntity {
        // Desestructurar los campos esperados del objeto de entrada
        const { productId, quantity, priceAtTime, productName, taxRate } = object;

        // --- Validación básica de campos requeridos ---
        if (!productId) throw CustomError.badRequest('CartItemMapper: missing productId');
        if (quantity === undefined || quantity === null) throw CustomError.badRequest('CartItemMapper: missing quantity');
        if (priceAtTime === undefined || priceAtTime === null) throw CustomError.badRequest('CartItemMapper: missing priceAtTime');
        // productName es opcional pero útil, solo advertimos si falta
        if (!productName) logger.warn(`CartItemMapper: missing productName for productId ${productId?._id || productId}`);
        if (taxRate === undefined || taxRate === null) throw CustomError.badRequest('CartItemMapper: missing taxRate');

        let productEntity: ProductEntity;

        // --- Lógica para mapear/crear la ProductEntity ---
        // Caso 1: productId es un objeto (probablemente poblado por Mongoose)
        if (typeof productId === 'object' && productId !== null && (productId._id || productId.id)) {
            try {
                // Intentar mapear usando ProductMapper (asumiendo que maneja datos poblados)
                // Pasamos todos los datos disponibles del objeto productId
                productEntity = ProductMapper.fromObjectToProductEntity(productId);
            } catch (error) {
                // Si falla el mapeo del producto poblado (ej. datos incompletos), crear un placeholder
                logger.error("Error mapeando producto poblado en CartItemMapper:", { error, productId });
                const idStr = productId._id?.toString() || productId.id?.toString() || 'unknown-id';
                // Crear placeholders para category y unit
                const placeholderCategory: CategoryEntity = { id: 0, name: 'Desconocida', description: '', isActive: true };
                const placeholderUnit: UnitEntity = { id: 0, name: 'Desconocida', description: '', isActive: true };
                productEntity = new ProductEntity(
                    idStr,
                    productId.name || productName || 'Producto Desconocido',
                    productId.price ?? Number(priceAtTime) ?? 0,
                    productId.stock ?? 0,
                    placeholderCategory,
                    placeholderUnit,
                    productId.imgUrl || '',
                    productId.isActive ?? true,
                    productId.description || '',
                    Number(productId.taxRate ?? taxRate ?? 21), // Prioridad: Producto > Item > Default
                    // Calcular priceWithTax para el placeholder también
                    Math.round((productId.price ?? Number(priceAtTime) ?? 0) * (1 + (Number(productId.taxRate ?? taxRate ?? 21) / 100)) * 100) / 100
                );
            }
            // Caso 2: productId es solo un ID (string u ObjectId)
        } else {
            // Crear un placeholder para ProductEntity
            const idString = typeof productId === 'string' ? productId : productId?.toString() ?? 'unknown-id';
            const basePricePlaceholder = Number(priceAtTime) ?? 0;
            const taxRatePlaceholder = Number(taxRate) ?? 21;
            const priceWithTaxPlaceholder = Math.round(basePricePlaceholder * (1 + taxRatePlaceholder / 100) * 100) / 100;
            // Crear placeholders para category y unit
            const placeholderCategory: CategoryEntity = { id: 0, name: 'Desconocida', description: '', isActive: true };
            const placeholderUnit: UnitEntity = { id: 0, name: 'Desconocida', description: '', isActive: true };

            productEntity = new ProductEntity(
                idString,
                productName || 'Producto Desconocido', // Usar productName si está disponible
                basePricePlaceholder, // Usar el precio guardado en el item
                0, // Stock desconocido
                placeholderCategory,
                placeholderUnit,
                '', // imgUrl desconocida
                true, // Asumir activo
                '', // description desconocida
                taxRatePlaceholder, // Usar la tasa guardada en el item
                priceWithTaxPlaceholder // Precio con IVA calculado para el placeholder
            );
        }
        // --- Fin Lógica de mapeo de productEntity ---

        // Convertir a números asegurando que no sean NaN
        const q = Number(quantity) || 0;
        const price = Number(priceAtTime) || 0; // Este es el precio SIN IVA guardado
        const rate = Number(taxRate) || 0;     // Tasa de IVA guardada

        // --- Calcular valores específicos para este item ---
        const unitPriceWithTax = Math.round(price * (1 + rate / 100) * 100) / 100;
        const subtotalWithTax = Math.round(q * unitPriceWithTax * 100) / 100;
        // --- Fin Cálculos ---

        // Crear la instancia de CartItemEntity pasando los 6 argumentos requeridos
        return new CartItemEntity(
            productEntity,      // 1. El producto mapeado/placeholder
            q,                  // 2. La cantidad
            price,              // 3. El precio SIN IVA guardado
            rate,               // 4. La tasa de IVA guardada
            unitPriceWithTax,   // 5. El precio unitario CON IVA calculado
            subtotalWithTax     // 6. El subtotal CON IVA calculado
        );
    }
}