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

// <<<--- Interfaz para detalles resueltos (importar o definir) --- >>>
interface ResolvedShippingDetails {
    recipientName: string; phone: string; streetAddress: string; postalCode?: string;
    neighborhoodName: string; cityName: string; additionalInfo?: string;
    originalAddressId?: string; originalNeighborhoodId: string; originalCityId: string;
}


export class OrderMongoDataSourceImpl implements OrderDataSource {

    private readonly couponDataSource: CouponDataSource = new CouponMongoDataSourceImpl();

    async create(
        createOrderDto: CreateOrderDto,
        calculatedDiscountRate: number,
        couponIdToIncrement: string | null | undefined,
        finalCustomerId: string,
        shippingDetails: ResolvedShippingDetails // <<<--- RECIBIR DETALLES
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


            // Crear el objeto para el modelo OrderModel, incluyendo shippingDetails
            const saleData = {
                customer: finalCustomerId,
                items: saleItems,
                subtotal: subtotalWithTax,
                taxAmount: totalTaxAmount,
                discountRate: discountRate,
                discountAmount: discountAmount,
                total: finalTotal,
                notes: createOrderDto.notes || "",
                status: 'pending' as 'pending' | 'completed' | 'cancelled', // Asegurar tipo
                // <<<--- MAPEAR DETALLES DE ENVÍO --- >>>
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
                // <<<--- FIN MAPEO --- >>>
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

    // ... (resto de métodos del datasource: getAll, findById, updateStatus, etc.) ...
    private async findSaleByIdPopulated(id: string): Promise<any> { /* ... código existente ... */
        if (!mongoose.Types.ObjectId.isValid(id)) return null; // Validar ID
        return OrderModel.findById(id)
            .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
            .populate({
                path: 'items.product', // La ruta al campo a poblar dentro del array
                model: 'Product',      // El modelo a usar
                populate: [            // Poblar anidado dentro del producto
                    { path: 'category', model: 'Category' },
                    { path: 'unit', model: 'Unit' }
                ]
            })
            .lean();
    }
    async getAll(paginationDto: PaginationDto): Promise<OrderEntity[]> { /* ... código existente ... */
        const { page, limit } = paginationDto;
        try {
            const salesDocs = await OrderModel.find()
                .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                .populate({ // <<<--- AÑADIR POPULATE AQUÍ TAMBIÉN
                    path: 'items.product',
                    model: 'Product',
                    populate: [{ path: 'category' }, { path: 'unit' }]
                })
                .limit(limit).skip((page - 1) * limit).sort({ date: -1 }).lean();
            return salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error("[OrderDS] Error obteniendo ventas:", { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al obtener ventas: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async findById(id: string): Promise<OrderEntity> { /* ... código existente ... */
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


    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        let retries = 3; // Número máximo de reintentos
        let lastError: any = null; // Almacenar el último error para el throw final

        while (retries > 0) {
            const session = await mongoose.startSession();
            session.startTransaction();
            logger.info(`[OrderDS] Iniciando TX (Intento ${4 - retries}) actualizar estado pedido ${id}`, { session: session.id });

            try {
                if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de pedido inválido");

                const sale = await OrderModel.findById(id).session(session);
                if (!sale) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);

                if (sale.status === updateOrderStatusDto.status) {
                    logger.info(`[OrderDS] Pedido ${id} ya está ${updateOrderStatusDto.status}.`);
                    await session.commitTransaction(); // Commit vacío para cerrar TX
                    session.endSession(); // Terminar sesión
                    const currentSaleDoc = await this.findSaleByIdPopulated(id);
                    if (!currentSaleDoc) throw CustomError.internalServerError("Error al recuperar venta sin cambios.");
                    return OrderMapper.fromObjectToSaleEntity(currentSaleDoc); // Devolver estado actual
                }

                // Lógica para restaurar stock si se cancela
                if (updateOrderStatusDto.status === 'cancelled' && (sale.status === 'pending' || sale.status === 'completed')) {
                    logger.info(`[OrderDS] Cancelando pedido ${id}. Restaurando stock...`);
                    for (const item of sale.items) {
                        // Usar updateOne para mayor seguridad en concurrencia (opcional pero bueno)
                        const stockUpdateResult = await ProductModel.updateOne(
                            { _id: item.product, stock: { $gte: 0 } }, // Condición opcional para evitar stock negativo
                            { $inc: { stock: item.quantity } },
                            { session }
                        );
                        if (stockUpdateResult.modifiedCount > 0) {
                            logger.debug(`[OrderDS] Stock restaurado para prod ${item.product} (+${item.quantity})`);
                        } else {
                            logger.warn(`[OrderDS] No se pudo restaurar stock para prod ${item.product} (posiblemente no encontrado o stock ya restaurado)`);
                        }
                    }
                }

                // Actualizar estado y notas
                sale.status = updateOrderStatusDto.status;
                if (updateOrderStatusDto.notes !== undefined) sale.notes = updateOrderStatusDto.notes;

                // Guardar los cambios en el pedido
                await sale.save({ session });
                logger.info(`[OrderDS] Estado pedido ${id} actualizado a ${updateOrderStatusDto.status}`);

                // Si todo fue bien, hacer commit
                await session.commitTransaction();
                logger.info(`[OrderDS] TX commit (Intento ${4 - retries}) actualización estado pedido ${id}`);
                session.endSession(); // Terminar sesión después de commit exitoso

                // Obtener y devolver la venta actualizada y poblada
                const updatedSaleDoc = await this.findSaleByIdPopulated(id);
                if (!updatedSaleDoc) throw CustomError.internalServerError("Error recuperando venta actualizada post-commit.");
                return OrderMapper.fromObjectToSaleEntity(updatedSaleDoc); // ÉXITO: Salir de la función

            } catch (error: any) {
                lastError = error; // Guardar el error de este intento
                await session.abortTransaction();
                logger.warn(`[OrderDS] TX abortada (Intento ${4 - retries}) para pedido ${id}`, { session: session.id, error: error.message });
                session.endSession(); // Terminar sesión después de abortar

                // Verificar si es un WriteConflict y quedan reintentos
                if (error.code === 112 && retries > 1) { // Código 112 es WriteConflict
                    retries--;
                    const delay = Math.pow(2, 3 - retries) * 100; // Backoff exponencial (100ms, 200ms, 400ms)
                    logger.warn(`WriteConflict detectado para pedido ${id}. Reintentando en ${delay}ms... (${retries} intentos restantes)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Saltar a la siguiente iteración del bucle while
                } else {
                    // Si no es WriteConflict o se acabaron los reintentos, salir del bucle para lanzar error
                    break;
                }
            }
        } // Fin del while

        // Si el bucle terminó debido a un error final o por agotar reintentos
        logger.error(`[OrderDS] Error final TX actualizar estado pedido ${id}`, { error: lastError });
        if (lastError instanceof CustomError) throw lastError; // Relanzar si ya es CustomError

        // Verificar si el último error fue WriteConflict después de agotar reintentos
        if (lastError && lastError.code === 112) {
            throw CustomError.internalServerError(`No se pudo actualizar el estado del pedido ${id} después de varios intentos debido a conflictos de escritura.`);
        }

        // Lanzar un error genérico para otros casos
        throw CustomError.internalServerError(`Error actualizando estado venta: ${lastError?.message || String(lastError)}`);
    }


    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]> { /* ... código existente ... */
        const { page, limit } = paginationDto;
        try {
            if (!mongoose.Types.ObjectId.isValid(customerId)) throw CustomError.badRequest("ID de cliente inválido");
            const salesDocs = await OrderModel.find({ customer: customerId })
                .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                .populate({ // <<<--- AÑADIR POPULATE AQUÍ TAMBIÉN
                    path: 'items.product',
                    model: 'Product',
                    populate: [{ path: 'category' }, { path: 'unit' }]
                })
                .limit(limit).skip((page - 1) * limit).sort({ date: -1 }).lean();
            return salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas cliente ${customerId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por cliente: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]> { /* ... código existente ... */
        const { page, limit } = paginationDto;
        try {
            if (startDate > endDate) throw CustomError.badRequest("Fecha inicio > fecha fin");
            const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999);
            const salesDocs = await OrderModel.find({ date: { $gte: startDate, $lte: endOfDay } })
                .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                .populate({ // <<<--- AÑADIR POPULATE AQUÍ TAMBIÉN
                    path: 'items.product',
                    model: 'Product',
                    populate: [{ path: 'category' }, { path: 'unit' }]
                })
                .limit(limit).skip((page - 1) * limit).sort({ date: -1 }).lean();
            return salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas por rango fecha:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por rango fecha: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}