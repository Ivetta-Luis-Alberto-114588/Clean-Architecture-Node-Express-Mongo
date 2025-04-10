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
            .populate({ path: 'items.product', populate: [{ path: 'category' }, { path: 'unit' }] })
            .lean();
    }
    async getAll(paginationDto: PaginationDto): Promise<OrderEntity[]> { /* ... código existente ... */
        const { page, limit } = paginationDto;
        try {
            const salesDocs = await OrderModel.find()
                .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                .populate({ path: 'items.product', populate: [{ path: 'category' }, { path: 'unit' }] })
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
    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> { /* ... código existente ... */
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info(`[OrderDS] Iniciando TX actualizar estado pedido ${id}`, { session: session.id });
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de pedido inválido");
            const sale = await OrderModel.findById(id).session(session);
            if (!sale) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            if (sale.status === updateOrderStatusDto.status) {
                logger.info(`[OrderDS] Pedido ${id} ya está ${updateOrderStatusDto.status}.`);
                await session.commitTransaction();
                const currentSaleDoc = await this.findSaleByIdPopulated(id); // Necesitas poblarlo
                if (!currentSaleDoc) throw CustomError.internalServerError("Error al recuperar venta sin cambios.");
                return OrderMapper.fromObjectToSaleEntity(currentSaleDoc);
            }
            if (updateOrderStatusDto.status === 'cancelled' && (sale.status === 'pending' || sale.status === 'completed')) {
                logger.info(`[OrderDS] Cancelando pedido ${id}. Restaurando stock...`);
                for (const item of sale.items) {
                    await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { session });
                    logger.debug(`[OrderDS] Stock restaurado para prod ${item.product} (+${item.quantity})`);
                }
            }
            sale.status = updateOrderStatusDto.status;
            if (updateOrderStatusDto.notes !== undefined) sale.notes = updateOrderStatusDto.notes;
            await sale.save({ session });
            logger.info(`[OrderDS] Estado pedido ${id} actualizado a ${updateOrderStatusDto.status}`);
            await session.commitTransaction();
            logger.info(`[OrderDS] TX commit actualización estado pedido ${id}`);
            const updatedSaleDoc = await this.findSaleByIdPopulated(id);
            if (!updatedSaleDoc) throw CustomError.internalServerError("Error recuperando venta actualizada.");
            return OrderMapper.fromObjectToSaleEntity(updatedSaleDoc);
        } catch (error) {
            logger.error(`[OrderDS] Error TX actualizar estado pedido ${id}, rollback...`, { error });
            await session.abortTransaction();
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error actualizando estado venta: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            logger.info(`[OrderDS] Sesión finalizada actualización estado`, { session: session?.id });
            session.endSession();
        }
    }
    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]> { /* ... código existente ... */
        const { page, limit } = paginationDto;
        try {
            if (!mongoose.Types.ObjectId.isValid(customerId)) throw CustomError.badRequest("ID de cliente inválido");
            const salesDocs = await OrderModel.find({ customer: customerId })
                .populate({ path: 'customer', populate: { path: 'neighborhood', populate: { path: 'city' } } })
                .populate({ path: 'items.product', populate: [{ path: 'category' }, { path: 'unit' }] })
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
                .populate({ path: 'items.product', populate: [{ path: 'category' }, { path: 'unit' }] })
                .limit(limit).skip((page - 1) * limit).sort({ date: -1 }).lean();
            return salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error(`[OrderDS] Error buscando ventas por rango fecha:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error buscando ventas por rango fecha: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}