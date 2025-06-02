// src/infrastructure/datasources/order/order.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { OrderModel } from "../../../data/mongodb/models/order/order.model";
import { OrderStatusModel } from "../../../data/mongodb/models/order/order-status.model";
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

    private readonly couponDataSource: CouponDataSource = new CouponMongoDataSourceImpl();
    // --- MÉTODO HELPER PARA POBLAR (actualizado para incluir OrderStatus) ---
    private async findSaleByIdPopulated(id: string): Promise<any> {
        logger.info(`[OrderDS] findSaleByIdPopulated: Received id: '${id}', length: ${id.length}`);
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        logger.info(`[OrderDS] findSaleByIdPopulated: mongoose.Types.ObjectId.isValid('${id}') is ${isValidObjectId}`);
        if (!isValidObjectId) {
            logger.warn(`[OrderDS] findSaleByIdPopulated: ID '${id}' is not a valid ObjectId according to mongoose.Types.ObjectId.isValid.`);
            return null;
        }
        try {
            const result = await OrderModel.findById(id)
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
            logger.info(`[OrderDS] findSaleByIdPopulated: OrderModel.findById('${id}') succeeded.`);
            return result;
        } catch (castError: any) {
            logger.error(`[OrderDS] findSaleByIdPopulated: OrderModel.findById('${id}') threw an error:`, { error: castError, message: castError.message, stack: castError.stack });
            throw castError;
        }
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
    }    // --- MÉTODO getAll MODIFICADO ---
    async getAll(paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const queryFilter = {}; // Filtro vacío para obtener todos (admin)

        try {
            // Ejecutar conteo y búsqueda en paralelo
            const [total, salesDocs] = await Promise.all([
                OrderModel.countDocuments(queryFilter), // Contar todos los documentos
                OrderModel.find(queryFilter) // Encontrar documentos para la página
                    .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
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

            // Poblar status manualmente para evitar errores con referencias inválidas
            const populatedSalesDocs = await Promise.all(
                salesDocs.map(async (doc: any) => {
                    try {
                        // Solo intentar poblar si el status es un ObjectId válido
                        if (doc.status && mongoose.Types.ObjectId.isValid(doc.status)) {
                            const { OrderStatusModel } = await import('../../../data/mongodb/models/order/order-status.model');
                            const populatedStatus = await OrderStatusModel.findById(doc.status).lean();
                            doc.status = populatedStatus || doc.status;
                        }
                        // Si no es un ObjectId válido, dejarlo como está (el mapper lo manejará)
                    } catch (error) {
                        logger.warn(`[OrderDS] Error poblando status para orden ${doc._id}:`, { error, status: doc.status });
                        // Dejar el status como está si hay error
                    }
                    return doc;
                })
            );

            const orders = populatedSalesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));

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
        logger.info(`[OrderDS] findById: Received id: '${id}', length: ${id.length}`);
        try {
            const saleDoc = await this.findSaleByIdPopulated(id);
            if (!saleDoc) {
                logger.warn(`[OrderDS] findById: findSaleByIdPopulated returned null for id '${id}'. Throwing notFound.`);
                throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            }
            return OrderMapper.fromObjectToSaleEntity(saleDoc);
        } catch (error: any) {
            logger.error(`[OrderDS] findById: Catching error for id '${id}':`, { error, message: error.message, stack: error.stack });
            if (error instanceof mongoose.Error.CastError) {
                logger.error(`[OrderDS] findById: Error is mongoose.Error.CastError for id '${id}'. Path: ${error.path}, Value: ${error.value}, Kind: ${error.kind}, Reason: ${error.reason?.message}`);
                throw CustomError.badRequest(`ID venta inválido: ${id}`);
            }
            if (error instanceof CustomError) {
                logger.warn(`[OrderDS] findById: Error is CustomError for id '${id}'. Message: ${error.message}, StatusCode: ${error.statusCode}`);
                throw error;
            }
            logger.error(`[OrderDS] findById: Error is an unknown error for id '${id}'.`);
            throw CustomError.internalServerError(`Error buscando venta: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // --- updateStatus (sin cambios) ---
    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        let retries = 3; // Para manejar posibles WriteConflicts
        let lastError: any = null;

        while (retries > 0) {
            const session = await mongoose.startSession();
            session.startTransaction();
            logger.info(`[OrderDS] Iniciando TX (Intento ${4 - retries}) actualizar estado pedido ${id}`, { session: session.id });

            try {
                if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de pedido inválido");

                const sale = await OrderModel.findById(id).session(session);
                if (!sale) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);

                // Si el estado ya es el deseado, no hacer nada más que actualizar notas si vienen
                if (sale.status && sale.status.toString() === updateOrderStatusDto.statusId) {
                    if (updateOrderStatusDto.notes !== undefined && sale.notes !== updateOrderStatusDto.notes) {
                        sale.notes = updateOrderStatusDto.notes;
                        await sale.save({ session });
                        logger.info(`[OrderDS] Pedido ${id} ya en estado ${updateOrderStatusDto.statusId}. Solo notas actualizadas.`);
                    } else {
                        logger.info(`[OrderDS] Pedido ${id} ya está en el estado ${updateOrderStatusDto.statusId}. Sin cambios.`);
                    }
                    await session.commitTransaction();
                    session.endSession();
                    const currentSaleDoc = await this.findSaleByIdPopulated(id); // Reutilizar helper
                    if (!currentSaleDoc) throw CustomError.internalServerError("Error al recuperar venta sin cambios.");
                    return OrderMapper.fromObjectToSaleEntity(currentSaleDoc);
                }

                // --- VALIDACIÓN DE TRANSICIÓN ---
                const currentStatusId = sale.status; // Este es un ObjectId o null/undefined
                const newStatusId = new mongoose.Types.ObjectId(updateOrderStatusDto.statusId);

                if (currentStatusId) { // Solo validar si hay un estado actual
                    const currentStatusDoc = await OrderStatusModel.findById(currentStatusId).session(session).lean();
                    const newStatusDoc = await OrderStatusModel.findById(newStatusId).session(session).lean();

                    if (!currentStatusDoc) throw CustomError.internalServerError(`Estado actual ID ${currentStatusId} no encontrado para pedido ${id}`);
                    if (!newStatusDoc) throw CustomError.badRequest(`Nuevo estado ID ${newStatusId} no encontrado`);

                    if (!newStatusDoc.isActive) {
                        throw CustomError.badRequest(`No se puede cambiar a un estado inactivo ('${newStatusDoc.name}')`);
                    }

                    // Verificar si la transición está permitida
                    const isTransitionAllowed = currentStatusDoc.canTransitionTo?.some(
                        (allowedId: mongoose.Types.ObjectId) => allowedId.equals(newStatusId)
                    );

                    if (currentStatusDoc.canTransitionTo && currentStatusDoc.canTransitionTo.length > 0 && !isTransitionAllowed) {
                        throw CustomError.badRequest(`Transición de estado de '${currentStatusDoc.name}' a '${newStatusDoc.name}' no permitida.`);
                    }
                    // Si canTransitionTo está vacío, algunas lógicas permiten cualquier transición (si no es final).
                    // Si canTransitionTo no existe o es vacío y NO es un estado final, se podría permitir. Ajustar según tu lógica.
                    // Por ahora, si canTransitionTo tiene elementos, se debe cumplir. Si está vacío, se deniega a menos que no haya restricciones.
                }
                // --- FIN VALIDACIÓN ---

                let shouldRestoreStock = false;
                if (updateOrderStatusDto.statusId) {
                    const newStatus = await OrderStatusModel.findById(newStatusId).session(session);
                    const currentStatus = sale.status ? await OrderStatusModel.findById(sale.status).session(session) : null;

                    // Lógica de restauración de stock (ejemplo)
                    if (newStatus?.code === 'CANCELLED' && currentStatus && ['PENDING', 'COMPLETED', 'PREPARING'].includes(currentStatus.code)) {
                        shouldRestoreStock = true;
                    }
                }

                if (shouldRestoreStock) {
                    logger.info(`[OrderDS] Cancelando pedido ${id}. Restaurando stock...`);
                    for (const item of sale.items) {
                        await ProductModel.updateOne( // ProductModel debe ser importado
                            { _id: item.product },
                            { $inc: { stock: item.quantity } },
                            { session }
                        );
                        logger.debug(`[OrderDS] Stock restaurado para prod ${item.product} (+${item.quantity})`);
                    }
                }

                sale.status = newStatusId;
                if (updateOrderStatusDto.notes !== undefined) {
                    sale.notes = updateOrderStatusDto.notes;
                }
                await sale.save({ session });
                logger.info(`[OrderDS] Estado pedido ${id} actualizado a ${updateOrderStatusDto.statusId}`);

                await session.commitTransaction();
                logger.info(`[OrderDS] TX commit (Intento ${4 - retries}) actualización estado pedido ${id}`);
                session.endSession();

                const updatedSaleDoc = await this.findSaleByIdPopulated(id); // Reutilizar helper
                if (!updatedSaleDoc) throw CustomError.internalServerError("Error recuperando venta actualizada post-commit.");
                return OrderMapper.fromObjectToSaleEntity(updatedSaleDoc);

            } catch (error: any) {
                lastError = error;
                await session.abortTransaction();
                logger.warn(`[OrderDS] TX abortada (Intento ${4 - retries}) para pedido ${id}`, { session: session.id, error: error.message });
                session.endSession();

                if (error.code === 112 && retries > 1) { // Error de WriteConflict en MongoDB
                    retries--;
                    const delay = Math.pow(2, 3 - retries) * 100; // Backoff exponencial
                    logger.warn(`WriteConflict detectado para pedido ${id}. Reintentando en ${delay}ms... (${retries} intentos restantes)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Reintentar el bucle while
                } else {
                    break; // Salir del bucle si no es WriteConflict o se agotaron reintentos
                }
            }
        }

        // Si todos los reintentos fallan
        logger.error(`[OrderDS] Error final TX actualizar estado pedido ${id}`, { error: lastError });
        if (lastError instanceof CustomError) throw lastError;
        if (lastError && lastError.code === 112) { // E11000 duplicate key error
            throw CustomError.internalServerError(`No se pudo actualizar el estado del pedido ${id} después de varios intentos debido a conflictos.`);
        }
        throw CustomError.internalServerError(`Error actualizando estado venta: ${lastError?.message || String(lastError)}`);
    }


    async findByStatus(statusId: string, paginationDto: PaginationDto): Promise<{ total: number; orders: OrderEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        const queryFilter = { status: new mongoose.Types.ObjectId(statusId) };

        try {
            if (!mongoose.Types.ObjectId.isValid(statusId)) throw CustomError.badRequest("ID de estado inválido");

            const [total, salesDocs] = await Promise.all([
                OrderModel.countDocuments(queryFilter),
                OrderModel.find(queryFilter)
                    .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                    .populate({ path: 'status', model: 'OrderStatus' }) // Poblar el estado
                    .populate({
                        path: 'items.product',
                        model: 'Product',
                        populate: [{ path: 'category' }, { path: 'unit' }]
                    })
                    .limit(limit)
                    .skip(skip)
                    .sort({ date: -1 }) // O el orden que prefieras para el dashboard
                    .lean()
            ]);

            const orders = salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
            return { total, orders };

        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas por estado ${statusId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por estado: ${error instanceof Error ? error.message : String(error)}`);
        }
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

            // Poblar status manualmente para evitar errores con referencias inválidas
            const populatedSalesDocs = await Promise.all(
                salesDocs.map(async (doc: any) => {
                    try {
                        // Solo intentar poblar si el status es un ObjectId válido
                        if (doc.status && mongoose.Types.ObjectId.isValid(doc.status)) {
                            const { OrderStatusModel } = await import('../../../data/mongodb/models/order/order-status.model');
                            const populatedStatus = await OrderStatusModel.findById(doc.status).lean();
                            doc.status = populatedStatus || doc.status;
                        }
                        // Si no es un ObjectId válido, dejarlo como está (el mapper lo manejará)
                    } catch (error) {
                        logger.warn(`[OrderDS] Error poblando status para orden ${doc._id}:`, { error, status: doc.status });
                        // Dejar el status como está si hay error
                    }
                    return doc;
                })
            );

            const orders = populatedSalesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
            return { total, orders };

        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas cliente ${customerId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por cliente: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // --- FIN findByCustomer MODIFICADO ---    // --- findByDateRange MODIFICADO ---
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

            // Poblar status manualmente para evitar errores con referencias inválidas
            const populatedSalesDocs = await Promise.all(
                salesDocs.map(async (doc: any) => {
                    try {
                        // Solo intentar poblar si el status es un ObjectId válido
                        if (doc.status && mongoose.Types.ObjectId.isValid(doc.status)) {
                            const { OrderStatusModel } = await import('../../../data/mongodb/models/order/order-status.model');
                            const populatedStatus = await OrderStatusModel.findById(doc.status).lean();
                            doc.status = populatedStatus || doc.status;
                        }
                        // Si no es un ObjectId válido, dejarlo como está (el mapper lo manejará)
                    } catch (error) {
                        logger.warn(`[OrderDS] Error poblando status para orden ${doc._id}:`, { error, status: doc.status });
                        // Dejar el status como está si hay error
                    }
                    return doc;
                })
            );

            const orders = populatedSalesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
            return { total, orders };

        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas por rango fecha:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por rango fecha: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // --- FIN findByDateRange MODIFICADO ---

    // --- MÉTODO updateOrder ---
    async updateOrder(id: string, dto: import('../../../domain/dtos/order/update-order.dto').UpdateOrderDto): Promise<OrderEntity> {
      // TODO: recalcular totales si cambian items
      const updateData: any = {};
      if (dto.data.items) {
        updateData.items = dto.data.items.map(i => ({
          product: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: +(i.unitPrice * i.quantity).toFixed(2)
        }));
      }
      if (dto.data.shippingDetails) {
        updateData.shippingDetails = {
          recipientName: dto.data.shippingDetails.recipientName,
          phone: dto.data.shippingDetails.phone,
          streetAddress: dto.data.shippingDetails.streetAddress,
          postalCode: dto.data.shippingDetails.postalCode,
          neighborhoodName: undefined, // revisar mapping a entity
          cityName: undefined,
          additionalInfo: dto.data.shippingDetails.additionalInfo,
          originalNeighborhoodId: dto.data.shippingDetails.neighborhoodId ? new mongoose.Types.ObjectId(dto.data.shippingDetails.neighborhoodId) : undefined,
          originalCityId: dto.data.shippingDetails.cityId ? new mongoose.Types.ObjectId(dto.data.shippingDetails.cityId) : undefined
        };
      }
      if (dto.data.notes !== undefined) updateData.notes = dto.data.notes;
      if (dto.data.couponCode !== undefined) updateData['metadata.couponCodeUsed'] = dto.data.couponCode;

      const doc = await OrderModel.findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
        .populate({ path: 'status', model: 'OrderStatus' })
        .populate({ path: 'items.product', model: 'Product', populate: [{ path: 'category' }, { path: 'unit' }] })
        .lean();
      if (!doc) throw CustomError.notFound(`Pedido ${id} no encontrado`);
      return OrderMapper.fromObjectToSaleEntity(doc);
    }
}