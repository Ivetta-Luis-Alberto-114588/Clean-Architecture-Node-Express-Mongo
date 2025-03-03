// src/infrastructure/datasources/sales/sale.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { SaleModel } from "../../../data/mongodb/models/sales/sale.model";
import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { SaleDataSource } from "../../../domain/datasources/sales/sale.datasource";
import { CreateSaleDto } from "../../../domain/dtos/sales/create-sale.dto";
import { UpdateSaleStatusDto } from "../../../domain/dtos/sales/update-sale-status.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { SaleEntity } from "../../../domain/entities/sales/sale.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { SaleMapper } from "../../mappers/sales/sale.mapper";

export class SaleMongoDataSourceImpl implements SaleDataSource {
    async create(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        // Iniciar una sesión para la transacción
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Buscar el cliente
            const customer = await CustomerModel.findById(createSaleDto.customerId);
            if (!customer) {
                throw CustomError.notFound(`Cliente con ID ${createSaleDto.customerId} no encontrado`);
            }
            
            // Array para almacenar los items de la venta
            const saleItems = [];
            let subtotal = 0;
            
            // Procesar cada item de la venta
            for (const item of createSaleDto.items) {
                // Buscar el producto
                const product = await ProductModel.findById(item.productId).session(session);
                if (!product) {
                    throw CustomError.notFound(`Producto con ID ${item.productId} no encontrado`);
                }
                
                // Verificar que el stock esté definido
                const productStock = product.stock;
                if (productStock === undefined || productStock === null) {
                    throw CustomError.badRequest(`El producto ${product.name || item.productId} no tiene información de stock definida`);
                }
                
                // Verificar valores válidos
                if (item.quantity <= 0) {
                    throw CustomError.badRequest(`La cantidad para el producto ${product.name} debe ser mayor que cero`);
                }
                
                if (item.unitPrice < 0) {
                    throw CustomError.badRequest(`El precio unitario para el producto ${product.name} no puede ser negativo`);
                }
                
                // Verificar que haya suficiente stock
                if (productStock < item.quantity) {
                    throw CustomError.badRequest(`Stock insuficiente para el producto ${product.name || item.productId}. Disponible: ${productStock}, Solicitado: ${item.quantity}`);
                }
                
                // Actualizar el stock del producto
                product.stock = productStock - item.quantity;
                await product.save({ session });
                
                // Calcular el subtotal del item con precisión de 2 decimales
                const itemSubtotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
                subtotal += itemSubtotal;
                
                // Añadir el item a la venta
                saleItems.push({
                    product: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: itemSubtotal
                });
            }
            
            // Verificar que haya al menos un item
            if (saleItems.length === 0) {
                throw CustomError.badRequest('La venta debe tener al menos un producto');
            }
            
            // Verificar valores de impuestos y descuentos
            if (createSaleDto.taxRate < 0 || createSaleDto.taxRate > 100) {
                throw CustomError.badRequest('La tasa de impuestos debe estar entre 0 y 100');
            }
            
            if (createSaleDto.discountRate < 0 || createSaleDto.discountRate > 100) {
                throw CustomError.badRequest('La tasa de descuento debe estar entre 0 y 100');
            }
            
            // Calcular impuestos y descuentos con precisión de 2 decimales
            const taxAmount = Math.round((subtotal * createSaleDto.taxRate) / 100 * 100) / 100;
            const discountAmount = Math.round((subtotal * createSaleDto.discountRate) / 100 * 100) / 100;
            const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
            
            // Validar que el total no sea negativo
            if (total < 0) {
                throw CustomError.badRequest('El total de la venta no puede ser negativo. Revise la tasa de descuento.');
            }
            
            // Crear la venta
            const saleData = {
                customer: createSaleDto.customerId,
                items: saleItems,
                subtotal,
                taxRate: createSaleDto.taxRate,
                taxAmount,
                discountRate: createSaleDto.discountRate,
                discountAmount,
                total,
                notes: createSaleDto.notes || "",
                status: 'pending' // Estado inicial
            };
            
            const sale = await SaleModel.create([saleData], { session });
            
            // Commit de la transacción
            await session.commitTransaction();
            session.endSession();
            
            // Obtener la venta completa con populate
            const completeSale = await SaleModel.findById(sale[0]._id)
                .populate({
                    path: 'customer',
                    populate: {
                        path: 'neighborhood',
                        populate: { path: 'city' }
                    }
                })
                .populate({
                    path: 'items.product',
                    populate: [
                        { path: 'category' },
                        { path: 'unit' }
                    ]
                });
                
            if (!completeSale) {
                throw CustomError.internalServerError("No se pudo recuperar la venta creada");
            }
            
            return SaleMapper.fromObjectToSaleEntity(completeSale);
            
        } catch (error) {
            // Si hay un error, hacemos rollback de la transacción
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            console.error("Error al crear la venta:", error);
            throw CustomError.internalServerError(`Error al crear la venta: ${error}`);
        }
    }
    
    async getAll(paginationDto: PaginationDto): Promise<SaleEntity[]> {
        const { page, limit } = paginationDto;
        
        try {
            const sales = await SaleModel.find()
                .populate({
                    path: 'customer',
                    populate: {
                        path: 'neighborhood',
                        populate: { path: 'city' }
                    }
                })
                .populate({
                    path: 'items.product',
                    populate: [
                        { path: 'category' },
                        { path: 'unit' }
                    ]
                })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ date: -1 }) // Ordenar por fecha descendente
                .exec();
            
            return sales.map(sale => SaleMapper.fromObjectToSaleEntity(sale));
        } catch (error) {
            console.error("Error al obtener las ventas:", error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw CustomError.internalServerError(`Error al obtener las ventas: ${error}`);
        }
    }
    
    async findById(id: string): Promise<SaleEntity> {
        try {
            const sale = await SaleModel.findById(id)
                .populate({
                    path: 'customer',
                    populate: {
                        path: 'neighborhood',
                        populate: { path: 'city' }
                    }
                })
                .populate({
                    path: 'items.product',
                    populate: [
                        { path: 'category' },
                        { path: 'unit' }
                    ]
                });
                
            if (!sale) {
                throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            }
            
            return SaleMapper.fromObjectToSaleEntity(sale);
        } catch (error) {
            console.error(`Error al buscar la venta con ID ${id}:`, error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw CustomError.internalServerError(`Error al buscar la venta: ${error}`);
        }
    }
    
    async updateStatus(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            // Buscar la venta
            const sale = await SaleModel.findById(id).session(session);
            if (!sale) {
                throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            }
            
            // Verificar si el estado actual es diferente al nuevo
            if (sale.status === updateSaleStatusDto.status) {
                throw CustomError.badRequest(`La venta ya tiene el estado '${updateSaleStatusDto.status}'`);
            }
            
            // Si está cancelando una venta que estaba pendiente o completada
            if (updateSaleStatusDto.status === 'cancelled' && 
                (sale.status === 'pending' || sale.status === 'completed')) {
                
                // Restaurar el stock de los productos
                for (const item of sale.items) {
                    const product = await ProductModel.findById(item.product).session(session);
                    if (product) {
                        // Verificar que product.stock exista
                        const productStock = product.stock;
                        if (productStock === undefined || productStock === null) {
                            throw CustomError.badRequest(`El producto no tiene información de stock definida`);
                        }
                        
                        // Restaurar el stock
                        product.stock = productStock + item.quantity;
                        await product.save({ session });
                    }
                }
            }
            
            // Actualizar el estado de la venta
            // Definimos una interfaz para el objeto de actualización
            interface UpdateSaleData {
                status: 'pending' | 'completed' | 'cancelled';
                notes?: string;
            }
            
            // Creamos el objeto con el tipo correcto
            const updateData: UpdateSaleData = {
                status: updateSaleStatusDto.status
            };
            
            // Actualizar notas si se proporcionan
            if (updateSaleStatusDto.notes !== undefined) {
                updateData.notes = updateSaleStatusDto.notes;
            }
            
            const updatedSale = await SaleModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true, session }
            )
            .populate({
                path: 'customer',
                populate: {
                    path: 'neighborhood',
                    populate: { path: 'city' }
                }
            })
            .populate({
                path: 'items.product',
                populate: [
                    { path: 'category' },
                    { path: 'unit' }
                ]
            });
            
            if (!updatedSale) {
                throw CustomError.notFound(`No se pudo actualizar la venta con ID ${id}`);
            }
            
            // Commit de la transacción
            await session.commitTransaction();
            session.endSession();
            
            return SaleMapper.fromObjectToSaleEntity(updatedSale);
        } catch (error) {
            // Si hay un error, hacemos rollback de la transacción
            await session.abortTransaction();
            session.endSession();
            
            console.error(`Error al actualizar el estado de la venta con ID ${id}:`, error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw CustomError.internalServerError(`Error al actualizar el estado de la venta: ${error}`);
        }
    }
    
    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<SaleEntity[]> {
        const { page, limit } = paginationDto;
        
        try {
            // Verificar que el cliente exista
            const customer = await CustomerModel.findById(customerId);
            if (!customer) {
                throw CustomError.notFound(`Cliente con ID ${customerId} no encontrado`);
            }
            
            const sales = await SaleModel.find({ customer: customerId })
                .populate({
                    path: 'customer',
                    populate: {
                        path: 'neighborhood',
                        populate: { path: 'city' }
                    }
                })
                .populate({
                    path: 'items.product',
                    populate: [
                        { path: 'category' },
                        { path: 'unit' }
                    ]
                })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ date: -1 }) // Ordenar por fecha descendente
                .exec();
            
            return sales.map(sale => SaleMapper.fromObjectToSaleEntity(sale));
        } catch (error) {
            console.error(`Error al buscar ventas del cliente con ID ${customerId}:`, error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw CustomError.internalServerError(`Error al buscar ventas por cliente: ${error}`);
        }
    }
    
    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<SaleEntity[]> {
        const { page, limit } = paginationDto;
        
        try {
            // Validar que el rango de fechas sea correcto
            if (startDate > endDate) {
                throw CustomError.badRequest("La fecha de inicio debe ser anterior a la fecha de fin");
            }
            
            const sales = await SaleModel.find({
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            })
            .populate({
                path: 'customer',
                populate: {
                    path: 'neighborhood',
                    populate: { path: 'city' }
                }
            })
            .populate({
                path: 'items.product',
                populate: [
                    { path: 'category' },
                    { path: 'unit' }
                ]
            })
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ date: -1 }) // Ordenar por fecha descendente
            .exec();
            
            return sales.map(sale => SaleMapper.fromObjectToSaleEntity(sale));
        } catch (error) {
            console.error(`Error al buscar ventas por rango de fechas:`, error);
            
            if (error instanceof CustomError) {
                throw error;
            }
            
            throw CustomError.internalServerError(`Error al buscar ventas por rango de fechas: ${error}`);
        }
    }
}