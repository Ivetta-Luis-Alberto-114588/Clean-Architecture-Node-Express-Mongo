import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { OrderEntity, OrderItemEntity } from "../../../domain/entities/order/order.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../customers/customer.mapper";
import { ProductMapper } from "../products/product.mapper";
import logger from "../../../configs/logger"; // Importar logger

export class SaleMapper {

    static fromObjectToSaleEntity(object: any): OrderEntity {
        if (!object) throw CustomError.badRequest('SaleMapper: object is null or undefined');

        const {
            _id, id, customer, items = [], subtotal, taxRate, taxAmount,
            discountRate, discountAmount, total, date, status, notes
        } = object;

        // Validaciones básicas
        if (!_id && !id) throw CustomError.badRequest('SaleMapper: missing id');
        if (!customer) throw CustomError.badRequest("SaleMapper: missing customer");
        if (!Array.isArray(items)) throw CustomError.badRequest("SaleMapper: items must be an array");
        // ... (validaciones para subtotal, taxAmount, etc. pueden ser necesarias)

        let customerEntity: CustomerEntity;
        try {
            // Mapear cliente (igual que antes)
            customerEntity = typeof customer === 'object' && customer !== null
                ? CustomerMapper.fromObjectToCustomerEntity(customer)
                : new CustomerEntity(customer.toString() || 'unknown', 'Cliente (No Poblado)', 'no@poblado.com', '0', 'N/A', {} as any, true); // Placeholder
        } catch (error) {
            logger.error('Error mapping customer in SaleMapper:', { error, customer });
            throw CustomError.internalServerError("SaleMapper: error mapping customer");
        }


        const saleItems: OrderItemEntity[] = items.map((item: any) => {
            if (!item || !item.product) {
                logger.warn('SaleMapper: Skipping invalid item in sale', { item });
                return null; // O lanzar error si se prefiere
            }

            let productEntity: ProductEntity;
            try {
                // Mapear producto si está poblado
                if (typeof item.product === 'object' && item.product !== null) {
                    productEntity = ProductMapper.fromObjectToProductEntity(item.product);
                } else {
                    // Crear placeholder si solo hay ID
                    // Necesitamos al menos la tasa de IVA guardada en el item o en el producto base
                    // Para calcular el precio base si es necesario (ej. para subtotalWithoutTax)
                    // Por ahora, creamos un placeholder simple.
                    productEntity = new ProductEntity(
                        item.product.toString(),
                        item.productName || "Producto (No Poblado)", // Usar nombre guardado
                        item.unitPrice, // Este es CON IVA
                        0, // Stock no relevante aquí
                        {} as any, // Placeholder category
                        {} as any, // Placeholder unit
                        "", true, "",
                        item.taxRateApplied ?? 21 // Usar tasa guardada o default
                    );
                }
            } catch (error) {
                logger.error('Error mapping product in SaleItem:', { error, product: item.product });
                // Crear placeholder en caso de error de mapeo
                productEntity = new ProductEntity(
                    item.product?._id?.toString() || item.product?.id?.toString() || item.product?.toString() || 'error-id',
                    item.productName || "Error Producto",
                    item.unitPrice, 0, {} as any, {} as any, "", true, "", item.taxRateApplied ?? 21
                );
            }


            return {
                product: productEntity,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice), // Precio CON IVA
                subtotal: Number(item.subtotal)   // Subtotal CON IVA
                // taxRateApplied: item.taxRateApplied // Si lo guardaste
            };
        }).filter((item: OrderItemEntity | null): item is OrderItemEntity => item !== null);

        if (saleItems.length === 0 && items.length > 0) {
            logger.error('SaleMapper: No valid items could be mapped for sale', { saleId: _id || id });
            // Dependiendo de la política, podrías lanzar un error o continuar con items vacíos
            // throw CustomError.internalServerError("Error crítico al mapear items de la venta.");
        }


        return new OrderEntity(
            _id?.toString() || id?.toString(),
            customerEntity,
            saleItems,
            Number(subtotal),       // Subtotal CON IVA
            Number(taxRate ?? 0), // Tasa general (puede ser 0 o irrelevante ahora)
            Number(taxAmount),      // Monto total de IVA
            Number(discountRate ?? 0),
            Number(discountAmount ?? 0),
            Number(total),          // Total final
            new Date(date),
            status,
            notes || ""
        );
    }

    // fromSaleEntityToObject no necesita cambios si la entidad y el modelo coinciden en estructura
    static fromSaleEntityToObject(entity: OrderEntity): any {
        return {
            customer: entity.customer.id, // Guardar solo el ID
            items: entity.items.map(item => ({
                product: item.product.id, // Guardar solo el ID
                quantity: item.quantity,
                unitPrice: item.unitPrice, // Precio CON IVA
                subtotal: item.subtotal    // Subtotal CON IVA
                // taxRateApplied: item.taxRateApplied // Si lo guardaste
            })),
            subtotal: entity.subtotal,
            taxAmount: entity.taxAmount,
            discountRate: entity.discountRate,
            discountAmount: entity.discountAmount,
            total: entity.total,
            date: entity.date,
            status: entity.status,
            notes: entity.notes
            // taxRate: entity.taxRate // Si mantuviste el campo global
        };
    }
}