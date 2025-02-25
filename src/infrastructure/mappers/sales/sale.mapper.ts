// src/infrastructure/mappers/sales/sale.mapper.ts
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { ProductEntity } from "../../../domain/entities/products/product.entity";
import { SaleEntity, SaleItemEntity } from "../../../domain/entities/sales/sale.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../customers/customer.mapper";
import { ProductMapper } from "../products/product.mapper";

export class SaleMapper {
    
    static fromObjectToSaleEntity(object: any): SaleEntity {
        // Validamos que object no sea null o undefined
        if (!object) throw CustomError.badRequest('mapper: object is null or undefined');
        
        const { _id, id, customer, items, subtotal, taxRate, taxAmount, discountRate, discountAmount, total, date, status, notes } = object;
        
        // Validaciones básicas
        if (!_id && !id) throw CustomError.badRequest('mapper: missing id');
        if (!customer) throw CustomError.badRequest("mapper: missing customer");
        if (!Array.isArray(items)) throw CustomError.badRequest("mapper: items must be an array");
        if (subtotal === undefined) throw CustomError.badRequest("mapper: missing subtotal");
        if (taxRate === undefined) throw CustomError.badRequest("mapper: missing taxRate");
        if (taxAmount === undefined) throw CustomError.badRequest("mapper: missing taxAmount");
        if (discountRate === undefined) throw CustomError.badRequest("mapper: missing discountRate");
        if (discountAmount === undefined) throw CustomError.badRequest("mapper: missing discountAmount");
        if (total === undefined) throw CustomError.badRequest("mapper: missing total");
        if (!date) throw CustomError.badRequest("mapper: missing date");
        if (!status) throw CustomError.badRequest("mapper: missing status");
        
        // Mapear el cliente
        let customerEntity: CustomerEntity;
        try {
            customerEntity = typeof customer === 'object' && customer !== null
                ? CustomerMapper.fromObjectToCustomerEntity(customer)
                : { 
                    id: customer.toString(), 
                    name: "Unknown Customer", 
                    email: "unknown@example.com",
                    phone: "000000000",
                    address: "Unknown Address",
                    neighborhood: {
                        id: 0,
                        name: "Unknown",
                        description: "Not populated",
                        city: {
                            id: 0,
                            name: "Unknown",
                            description: "Not populated",
                            isActive: true
                        },
                        isActive: true
                    },
                    isActive: true
                };
        } catch (error) {
            console.error('Error mapping customer:', error);
            throw CustomError.badRequest("mapper: error mapping customer");
        }
        
        // Mapear los items con manejo mejorado de errores
        const saleItems: SaleItemEntity[] = [];
        
        for (const item of items) {
            try {
                if (!item) continue; // Saltamos items nulos o indefinidos
                
                // Validaciones básicas
                if (!item.product) continue; // Saltamos items sin producto
                if (item.quantity === undefined) continue;
                if (item.unitPrice === undefined) continue;
                if (item.subtotal === undefined) continue;
                
                // Crear el producto con valores predeterminados seguros
                let productEntity: ProductEntity;
                
                if (typeof item.product === 'object' && item.product !== null) {
                    // Asegurarnos de que el producto tiene un ID
                    if (!item.product._id && !item.product.id) {
                        console.warn('Item sin ID de producto:', item);
                        continue; // Saltamos este item
                    }
                    
                    // Si el producto es un objeto, intentamos mapearlo con valores seguros
                    const productObj = { 
                        _id: item.product._id || item.product.id,
                        name: item.product.name || "Producto desconocido",
                        price: item.product.price || 0,
                        stock: item.product.stock !== undefined ? item.product.stock : 0,
                        category: item.product.category || {
                            id: 0,
                            name: "Categoría desconocida",
                            description: "No poblada",
                            isActive: true
                        },
                        unit: item.product.unit || {
                            id: 0,
                            name: "Unidad desconocida",
                            description: "No poblada",
                            isActive: true
                        },
                        imgUrl: item.product.imgUrl || "",
                        isActive: item.product.isActive !== undefined ? item.product.isActive : true,
                        description: item.product.description || ""
                    };
                    
                    try {
                        productEntity = ProductMapper.fromObjectToProductEntity(productObj);
                    } catch (error) {
                        console.error('Error en ProductMapper:', error);
                        // Si falla el mapper, creamos un objeto básico
                        productEntity = { 
                            id: productObj._id.toString(), 
                            name: productObj.name, 
                            price: productObj.price, 
                            stock: productObj.stock, 
                            category: productObj.category,
                            unit: productObj.unit,
                            imgUrl: productObj.imgUrl,
                            isActive: productObj.isActive,
                            description: productObj.description
                        };
                    }
                } else {
                    // Si solo tenemos el ID, creamos un objeto básico
                    const productId = typeof item.product === 'string' ? item.product : item.product.toString();
                    productEntity = { 
                        id: productId, 
                        name: "Producto desconocido", 
                        price: 0, 
                        stock: 0, 
                        category: {
                            id: 0,
                            name: "Categoría desconocida",
                            description: "No poblada",
                            isActive: true
                        },
                        unit: {
                            id: 0,
                            name: "Unidad desconocida",
                            description: "No poblada",
                            isActive: true
                        },
                        imgUrl: "",
                        isActive: true,
                        description: "No poblado"
                    };
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