// src/infrastructure/mappers/order/order.mapper.ts
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { OrderEntity, OrderItemEntity, ShippingDetailsEntity } from "../../../domain/entities/order/order.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../customers/customer.mapper";
import { ProductMapper } from "../products/product.mapper";
import logger from "../../../configs/logger";
import { CityEntity } from "../../../domain/entities/customers/citiy"; // <<<--- AÑADIR
import { NeighborhoodEntity } from "../../../domain/entities/customers/neighborhood"; // <<<--- AÑADIR

export class OrderMapper {

    static fromObjectToSaleEntity(object: any): OrderEntity {
        if (!object) throw CustomError.badRequest('SaleMapper: object is null or undefined');
        const {
            _id, id, customer, items = [], subtotal, taxRate, taxAmount,
            discountRate, discountAmount, total, date, status, notes,
            shippingDetails
        } = object;

        if (!_id && !id) throw CustomError.badRequest('SaleMapper: missing id');
        if (!customer) throw CustomError.badRequest("SaleMapper: missing customer");
        if (!Array.isArray(items)) throw CustomError.badRequest("SaleMapper: items must be an array");
        if (!shippingDetails) throw CustomError.badRequest("SaleMapper: missing shippingDetails");

        let customerEntity: CustomerEntity;
        try {
            // <<<--- CORRECCIÓN PLACEHOLDER --- >>>
            const placeholderNeighborhood: NeighborhoodEntity = {
                id: 'unknown-neighborhood', // Usar string
                name: 'Barrio (No Poblado)', description: '',
                city: { id: 'unknown-city', name: 'Ciudad (No Poblada)', description: '', isActive: true }, // Usar string
                isActive: true
            };
            customerEntity = typeof customer === 'object' && customer !== null
                ? CustomerMapper.fromObjectToCustomerEntity(customer)
                // Pasar placeholder corregido
                : new CustomerEntity(customer.toString() || 'unknown', 'Cliente (No Poblado)', 'no@poblado.com', '0', 'N/A', placeholderNeighborhood, true);
        } catch (error) {
            logger.error('Error mapping customer in SaleMapper:', { error, customer });
            throw CustomError.internalServerError("SaleMapper: error mapping customer");
        }


        const saleItems: OrderItemEntity[] = items.map((item: any): OrderItemEntity | null => {
            if (!item || !item.product) {
                logger.warn('SaleMapper: Skipping invalid item in sale', { item, saleId: _id || id });
                return null;
            }
            let productEntity: ProductEntity;
            try {
                if (typeof item.product === 'object' && item.product !== null) {
                    productEntity = ProductMapper.fromObjectToProductEntity(item.product);
                } else {
                    const productIdStr = item.product.toString();
                    // <<<--- CORRECCIÓN PLACEHOLDER PRODUCTO --- >>>
                    productEntity = new ProductEntity(
                        productIdStr,
                        item.productName || "Producto Desconocido",
                        item.unitPrice || 0, // Puede ser precio CON IVA
                        0,
                        // Placeholders usan string ID
                        { id: 0, name: 'Categoría Desconocida', description: '', isActive: true },
                        { id: 0, name: 'Unidad Desconocida', description: '', isActive: true },
                        item.productImgUrl || "", true, "", item.taxRateApplied ?? 21,
                        item.priceWithTax || 0, // Add missing priceWithTax argument
                    );
                }
            } catch (error) {
                logger.error('Error mapping product in SaleItem:', { error, product: item.product, saleId: _id || id });
                productEntity = new ProductEntity(0, "Error Producto", item.unitPrice || 0, 0,
                    { id: 0, name: 'Error', description: '', isActive: true },
                    { id: 0, name: 'Error', description: '', isActive: true }, "", true, "", 21,
                    Math.round((item.unitPrice || 0) * (1 + 21 / 100) * 100) / 100 // Añadir el priceWithTax calculado
                );
            }
            return { product: productEntity, quantity: Number(item.quantity) || 0, unitPrice: Number(item.unitPrice) || 0, subtotal: Number(item.subtotal) || 0 };
        }).filter((item): item is OrderItemEntity => item !== null);


        const finalShippingDetails: ShippingDetailsEntity = {
            recipientName: shippingDetails.recipientName, phone: shippingDetails.phone, streetAddress: shippingDetails.streetAddress,
            postalCode: shippingDetails.postalCode, neighborhoodName: shippingDetails.neighborhoodName, cityName: shippingDetails.cityName,
            additionalInfo: shippingDetails.additionalInfo,
        };

        return new OrderEntity(
            _id?.toString() || id?.toString(),
            customerEntity, saleItems,
            Number(subtotal) || 0, Number(taxRate ?? 0), Number(taxAmount) || 0,
            Number(discountRate ?? 0), Number(discountAmount ?? 0), Number(total) || 0,
            new Date(date || Date.now()), status || 'pending', notes || "",
            finalShippingDetails
        );
    }

    static fromSaleEntityToObject(entity: OrderEntity): any { /* ... código sin cambios ... */
        return {
            customer: entity.customer.id,
            items: entity.items.map(item => ({ product: item.product.id, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal })),
            subtotal: entity.subtotal, taxAmount: entity.taxAmount, discountRate: entity.discountRate, discountAmount: entity.discountAmount, total: entity.total, date: entity.date, status: entity.status, notes: entity.notes,
            shippingDetails: entity.shippingDetails ? {
                recipientName: entity.shippingDetails.recipientName, phone: entity.shippingDetails.phone, streetAddress: entity.shippingDetails.streetAddress,
                postalCode: entity.shippingDetails.postalCode, neighborhoodName: entity.shippingDetails.neighborhoodName, cityName: entity.shippingDetails.cityName,
                additionalInfo: entity.shippingDetails.additionalInfo,
            } : undefined
        };
    }
}