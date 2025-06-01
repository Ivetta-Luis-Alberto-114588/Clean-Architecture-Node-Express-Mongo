// src/infrastructure/mappers/sales/sale.mapper.ts
import { SaleEntity, SaleItemEntity } from "../../../domain/entities/sales/sale.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../customers/customer.mapper";
import { ProductMapper } from "../products/product.mapper";

export class SaleMapper {
    
    static fromObjectToSaleEntity(object: any): SaleEntity {
        // Validamos que object no sea null o undefined
        if (!object) throw CustomError.badRequest('mapper: object is null or undefined');

        const { _id, id, customer, items, subtotal, taxRate, taxAmount, discountRate, discountAmount, total, date, status, notes } = object;

        // Validar campos requeridos
        if (!customer) throw CustomError.badRequest('mapper: customer is required');
        if (!items || !Array.isArray(items)) throw CustomError.badRequest('mapper: items must be an array');
        if (subtotal === undefined || subtotal === null) throw CustomError.badRequest('mapper: subtotal is required');
        if (total === undefined || total === null) throw CustomError.badRequest('mapper: total is required');

        // Mapear customer
        let customerEntity;
        try {
            customerEntity = CustomerMapper.fromObjectToCustomerEntity(customer);
        } catch (error) {
            throw CustomError.badRequest('mapper: error mapping customer');
        }

        // Mapear items
        const saleItems: SaleItemEntity[] = [];
        for (const item of items) {
            try {
                let productEntity;
                if (item.product && typeof item.product === 'object' && item.product._id) {
                    // El producto está poblado
                    productEntity = ProductMapper.fromObjectToProductEntity(item.product);
                } else if (item.product) {
                    // Solo tenemos el ID del producto, crear un objeto básico
                    const productId = typeof item.product === 'string' ? item.product : item.product.toString();
                    productEntity = ProductMapper.fromObjectToProductEntity({
                        _id: productId,
                        name: "Producto desconocido",
                        price: item.unitPrice || 0,
                        stock: 0,
                        category: {
                            _id: "000000000000000000000000",
                            name: "Categoría desconocida",
                            description: "No poblada",
                            isActive: true
                        },
                        unit: {
                            _id: "000000000000000000000000",
                            name: "Unidad desconocida",
                            description: "No poblada",
                            isActive: true
                        },
                        imgUrl: "",
                        isActive: true,
                        description: "No poblado",
                        taxRate: 21
                    });
                } else {
                    throw new Error('Product information missing');
                }

                // Añadir el item a la lista
                saleItems.push({
                    product: productEntity,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal
                });
            } catch (error) {
                console.error('Error mapping sale item:', error);
                // Continuamos con el siguiente item
            }
        }

        // Verificar que al menos tenemos un item
        if (saleItems.length === 0) {
            throw CustomError.badRequest("mapper: no valid items found");
        }

        // Crear y devolver la entidad Sale
        return new SaleEntity(
            _id?.toString() || id?.toString(),
            customerEntity,
            saleItems,
            Number(subtotal),
            Number(taxRate),
            Number(taxAmount),
            Number(discountRate),
            Number(discountAmount),
            Number(total),
            new Date(date),
            status,
            notes || ""
        );
    }
    
    static fromSaleEntityToObject(entity: SaleEntity): any {
        return {
            customer: entity.customer.id,
            items: entity.items.map(item => ({
                product: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal
            })),
            subtotal: entity.subtotal,
            taxRate: entity.taxRate,
            taxAmount: entity.taxAmount,
            discountRate: entity.discountRate,
            discountAmount: entity.discountAmount,
            total: entity.total,
            date: entity.date,
            status: entity.status,
            notes: entity.notes
        };
    }
}
