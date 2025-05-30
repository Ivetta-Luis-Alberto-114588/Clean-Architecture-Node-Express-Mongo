// src/infrastructure/datasources/order/order.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { OrderModel } from "../../../data/mongodb/models/order/order.model";
import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { OrderDataSource } from "../../../domain/datasources/order/order.datasource";
import { CreateOrderDto } from "../../../domain/dtos/order/create-order.dto";
import { UpdateOrderStatusDto } from "../../../domain/dtos/order/update-order-status.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { OrderEntity } from "../../../domain/entities/order/order.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { OrderMapper } from "../../mappers/order/order.mapper";
import logger from "../../../configs/logger";
import { CouponDataSource } from "../../../domain/datasources/coupon/coupon.datasource";
import { CouponMongoDataSourceImpl } from "../coupon/coupon.mongo.datasource.impl";

// Interfaz para detalles resueltos (importar o definir)
interface ResolvedShippingDetails {
    recipientName: string; phone: string; streetAddress: string; postalCode?: string;
    neighborhoodName: string; cityName: string; additionalInfo?: string;
    originalAddressId?: string; originalNeighborhoodId: string; originalCityId: string;
}


export class OrderMongoDataSourceImpl implements OrderDataSource {

    private readonly couponDataSource: CouponDataSource = new CouponMongoDataSourceImpl();    // --- MÉTODO HELPER PARA POBLAR (actualizado para incluir OrderStatus) ---
    private async findSaleByIdPopulated(id: string): Promise<any> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return OrderModel.findById(id)
            .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
            .populate({ path: 'status', model: 'OrderStatus' })
            .populate({
                path: 'items.product',
                model: 'Product',
                populate: [
                    { path: 'category', model: 'Category' },
                    { path: 'unit', model: 'Unit' }
                ]
            })
            .lean();
    }// --- MÉTODO CREATE (actualizado para usar OrderStatus ID) ---
    async create(
        createOrderDto: CreateOrderDto,
        calculatedDiscountRate: number,
        couponIdToIncrement: string | null | undefined,
        finalCustomerId: string,
        shippingDetails: ResolvedShippingDetails,
        defaultOrderStatusId: string
    ): Promise<OrderEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info(`[OrderDS] Iniciando TX crear pedido (Cliente: ${finalCustomerId})`);

        try {
            const saleItems = [];
            let subtotalWithTax = 0;
            let totalTaxAmount = 0;

            const customerExists = await CustomerModel.findById(finalCustomerId).session(session).lean();
            if (!customerExists) throw CustomError.notFound(`Cliente ${finalCustomerId} no encontrado.`);

            for (const itemDto of createOrderDto.items) {
                const product = await ProductModel.findById(itemDto.productId).session(session);
                if (!product) throw CustomError.notFound(`Producto ${itemDto.productId} no encontrado`);
                if (!product.isActive) throw CustomError.badRequest(`Producto ${product.name} no disponible.`);
                if (product.stock < itemDto.quantity) throw CustomError.badRequest(`Stock insuficiente para ${product.name}. Disp: ${product.stock}, Sol: ${itemDto.quantity}`);

                const unitPriceWithTax = itemDto.unitPrice;
                const itemSubtotalWithTax = Math.round(itemDto.quantity * unitPriceWithTax * 100) / 100;
                const basePrice = product.price;
                const itemTaxAmount = Math.round((itemDto.quantity * basePrice * (product.taxRate / 100)) * 100) / 100;

                subtotalWithTax += itemSubtotalWithTax;
                totalTaxAmount += itemTaxAmount;

                product.stock -= itemDto.quantity;
                await product.save({ session });

                saleItems.push({
                    product: itemDto.productId,
                    quantity: itemDto.quantity,
                    unitPrice: unitPriceWithTax,
                    subtotal: itemSubtotalWithTax
                });
            }
            if (saleItems.length === 0) throw CustomError.badRequest('La venta debe tener productos');

            const discountRate = calculatedDiscountRate;
            const discountAmount = Math.round((subtotalWithTax * discountRate / 100) * 100) / 100;
            const finalTotal = Math.round((subtotalWithTax - discountAmount) * 100) / 100;
            if (finalTotal < 0) throw CustomError.badRequest('Total negativo.');

            const saleData = {
                customer: finalCustomerId,
                items: saleItems,
                subtotal: subtotalWithTax,
                taxAmount: totalTaxAmount,
                discountRate: discountRate,
                discountAmount: discountAmount,
                total: finalTotal, notes: createOrderDto.notes || "",
                status: new mongoose.Types.ObjectId(defaultOrderStatusId),
                shippingDetails: {
                    recipientName: shippingDetails.recipientName,
                    phone: shippingDetails.phone,
                    streetAddress: shippingDetails.streetAddress,
                    postalCode: shippingDetails.postalCode,
                    neighborhoodName: shippingDetails.neighborhoodName,
                    cityName: shippingDetails.cityName,
                    additionalInfo: shippingDetails.additionalInfo,
                    originalAddressId: shippingDetails.originalAddressId ? new mongoose.Types.ObjectId(shippingDetails.originalAddressId) : undefined,
                    originalNeighborhoodId: new mongoose.Types.ObjectId(shippingDetails.originalNeighborhoodId),
                    originalCityId: new mongoose.Types.ObjectId(shippingDetails.originalCityId),
                },
                metadata: { couponCodeUsed: createOrderDto.couponCode || null }
            };

            const saleDocArray = await OrderModel.create([saleData], { session });
            const saleDoc = saleDocArray[0];
            logger.info(`[OrderDS] Pedido ${saleDoc._id} creado en sesión`);

            if (couponIdToIncrement) {
                await this.couponDataSource.incrementUsage(couponIdToIncrement, session);
                logger.info(`[OrderDS] Uso cupón ${couponIdToIncrement} incrementado`);
            }

            await session.commitTransaction();
            logger.info(`[OrderDS] TX commit para pedido ${saleDoc._id}`);

            const completeSale = await this.findSaleByIdPopulated(saleDoc._id.toString());
            if (!completeSale) throw CustomError.internalServerError("Error recuperando venta creada");

            return OrderMapper.fromObjectToSaleEntity(completeSale);

        } catch (error) {
            logger.error("[OrderDS] Error en TX crear pedido, rollback...", { error, session: session?.id });
            await session.abortTransaction();
            logger.warn(`[OrderDS] TX abortada (rollback) para cliente ${finalCustomerId}`, { session: session?.id });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error interno al crear la venta: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            logger.info(`[OrderDS] Finalizando sesión Mongoose crear pedido`, { session: session?.id });
            session.endSession();
        }
    }

    // --- MÉTODO getAll MODIFICADO ---
    async getAll(paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const queryFilter = {}; // Filtro vacío para obtener todos (admin)

        try {            // Ejecutar conteo y búsqueda en paralelo
            const [total, salesDocs] = await Promise.all([
                OrderModel.countDocuments(queryFilter), // Contar todos los documentos
                OrderModel.find(queryFilter) // Encontrar documentos para la página
                    .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                    .populate({ path: 'status', model: 'OrderStatus' })
                    .populate({
                        path: 'items.product',
                        model: 'Product',
                        populate: [{ path: 'category' }, { path: 'unit' }]
                    })
                    .limit(limit)
                    .skip(skip)
                    .sort({ date: -1 }) // Ordenar por fecha descendente
                    .lean() // Usar lean para mejor rendimiento si solo lees
            ]);

            const orders = salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));

            return { total, orders }; // Devolver el objeto con total y orders

        } catch (error) {
            logger.error("[OrderDS] Error obteniendo todas las ventas (admin):", { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al obtener ventas: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // --- FIN MÉTODO getAll MODIFICADO ---

    // --- findById (sin cambios) ---
    async findById(id: string): Promise<OrderEntity> {
        try {
            const saleDoc = await this.findSaleByIdPopulated(id);
            if (!saleDoc) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            return OrderMapper.fromObjectToSaleEntity(saleDoc);
        } catch (error) {
            logger.error(`[OrderDS] Error buscando venta ID ${id}:`, { error });
            if (error instanceof mongoose.Error.CastError) throw CustomError.badRequest(`ID venta inválido: ${id}`);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando venta: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // --- updateStatus (sin cambios) ---
    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        let retries = 3;
        let lastError: any = null;

        while (retries > 0) {
            const session = await mongoose.startSession();
            session.startTransaction();
            logger.info(`[OrderDS] Iniciando TX (Intento ${4 - retries}) actualizar estado pedido ${id}`, { session: session.id });

            try {
                if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de pedido inválido");

                const sale = await OrderModel.findById(id).session(session);
                if (!sale) throw CustomError.notFound(`Venta con ID ${id} no encontrada`); if (sale.status && sale.status.toString() === updateOrderStatusDto.statusId) {
                    logger.info(`[OrderDS] Pedido ${id} ya está en el estado ${updateOrderStatusDto.statusId}.`);
                    await session.commitTransaction();
                    session.endSession();
                    const currentSaleDoc = await this.findSaleByIdPopulated(id);
                    if (!currentSaleDoc) throw CustomError.internalServerError("Error al recuperar venta sin cambios.");
                    return OrderMapper.fromObjectToSaleEntity(currentSaleDoc);
                }

                // Para manejar la lógica de cancelación, necesitamos obtener los códigos de estado
                // Esto requiere consultar la colección OrderStatus
                const { OrderStatusModel } = await import('../../../data/mongodb/models/order/order-status.model');

                let shouldRestoreStock = false;
                if (updateOrderStatusDto.statusId) {
                    const [newStatus, currentStatus] = await Promise.all([
                        OrderStatusModel.findById(updateOrderStatusDto.statusId).session(session),
                        sale.status ? OrderStatusModel.findById(sale.status).session(session) : null
                    ]);

                    // Si el nuevo estado es 'cancelled' y el estado actual era 'pending' o 'completed'
                    if (newStatus?.code === 'CANCELLED' && currentStatus && ['PENDING', 'COMPLETED'].includes(currentStatus.code)) {
                        shouldRestoreStock = true;
                    }
                }

                if (shouldRestoreStock) {
                    logger.info(`[OrderDS] Cancelando pedido ${id}. Restaurando stock...`);
                    for (const item of sale.items) {
                        const stockUpdateResult = await ProductModel.updateOne(
                            { _id: item.product, stock: { $gte: 0 } },
                            { $inc: { stock: item.quantity } },
                            { session }
                        );
                        if (stockUpdateResult.modifiedCount > 0) {
                            logger.debug(`[OrderDS] Stock restaurado para prod ${item.product} (+${item.quantity})`);
                        } else {
                            logger.warn(`[OrderDS] No se pudo restaurar stock para prod ${item.product}`);
                        }
                    }
                }

                sale.status = new mongoose.Types.ObjectId(updateOrderStatusDto.statusId);
                if (updateOrderStatusDto.notes !== undefined) sale.notes = updateOrderStatusDto.notes; await sale.save({ session });
                logger.info(`[OrderDS] Estado pedido ${id} actualizado a ${updateOrderStatusDto.statusId}`);

                await session.commitTransaction();
                logger.info(`[OrderDS] TX commit (Intento ${4 - retries}) actualización estado pedido ${id}`);
                session.endSession();

                const updatedSaleDoc = await this.findSaleByIdPopulated(id);
                if (!updatedSaleDoc) throw CustomError.internalServerError("Error recuperando venta actualizada post-commit.");
                return OrderMapper.fromObjectToSaleEntity(updatedSaleDoc);

            } catch (error: any) {
                lastError = error;
                await session.abortTransaction();
                logger.warn(`[OrderDS] TX abortada (Intento ${4 - retries}) para pedido ${id}`, { session: session.id, error: error.message });
                session.endSession();

                if (error.code === 112 && retries > 1) {
                    retries--;
                    const delay = Math.pow(2, 3 - retries) * 100;
                    logger.warn(`WriteConflict detectado para pedido ${id}. Reintentando en ${delay}ms... (${retries} intentos restantes)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    break;
                }
            }
        }

        logger.error(`[OrderDS] Error final TX actualizar estado pedido ${id}`, { error: lastError });
        if (lastError instanceof CustomError) throw lastError;
        if (lastError && lastError.code === 112) {
            throw CustomError.internalServerError(`No se pudo actualizar el estado del pedido ${id} después de varios intentos debido a conflictos.`);
        }
        throw CustomError.internalServerError(`Error actualizando estado venta: ${lastError?.message || String(lastError)}`);
    }

    // --- findByCustomer MODIFICADO ---
    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const queryFilter = { customer: new mongoose.Types.ObjectId(customerId) }; try {
            if (!mongoose.Types.ObjectId.isValid(customerId)) throw CustomError.badRequest("ID de cliente inválido");

            const [total, salesDocs] = await Promise.all([
                OrderModel.countDocuments(queryFilter),
                OrderModel.find(queryFilter)
                    .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                    .populate({ path: 'status', model: 'OrderStatus' })
                    .populate({
                        path: 'items.product',
                        model: 'Product',
                        populate: [{ path: 'category' }, { path: 'unit' }]
                    })
                    .limit(limit)
                    .skip(skip)
                    .sort({ date: -1 })
                    .lean()
            ]);

            const orders = salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
            return { total, orders };

        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas cliente ${customerId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por cliente: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // --- FIN findByCustomer MODIFICADO ---

    // --- findByDateRange MODIFICADO ---
    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        try {
            if (startDate > endDate) throw CustomError.badRequest("Fecha inicio > fecha fin");
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            const queryFilter = { date: { $gte: startDate, $lte: endOfDay } }; const [total, salesDocs] = await Promise.all([
                OrderModel.countDocuments(queryFilter),
                OrderModel.find(queryFilter)
                    .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                    .populate({ path: 'status', model: 'OrderStatus' })
                    .populate({
                        path: 'items.product',
                        model: 'Product',
                        populate: [{ path: 'category' }, { path: 'unit' }]
                    })
                    .limit(limit)
                    .skip(skip)
                    .sort({ date: -1 })
                    .lean()
            ]);

            const orders = salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
            return { total, orders };

        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas por rango fecha:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por rango fecha: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // --- FIN findByDateRange MODIFICADO ---
}