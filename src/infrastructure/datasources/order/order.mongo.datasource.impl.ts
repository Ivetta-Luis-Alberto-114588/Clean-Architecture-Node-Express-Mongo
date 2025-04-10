// src/infrastructure/datasources/order/order.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { OrderModel } from "../../../data/mongodb/models/order/order.model";
import { ProductModel } from "../../../data/mongodb/models/products/product.model";
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model"; // Asegúrate que esté importado
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

export class OrderMongoDataSourceImpl implements OrderDataSource {

    private readonly couponDataSource: CouponDataSource = new CouponMongoDataSourceImpl();

    async create(
        createOrderDto: CreateOrderDto,
        calculatedDiscountRate: number,
        couponIdToIncrement: string | null | undefined,
        finalCustomerId: string // ID del cliente ya determinado
    ): Promise<OrderEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info(`Iniciando transacción para crear pedido (Cliente: ${finalCustomerId})`); // Usar finalCustomerId

        try {
            // <<<--- INICIALIZAR VARIABLES --- >>>
            const saleItems = [];
            let subtotalWithTax = 0;
            let totalTaxAmount = 0;
            // <<<--- FIN INICIALIZAR VARIABLES --- >>>

            // Validar que el cliente exista (opcional, pero buena práctica)
            const customerExists = await CustomerModel.findById(finalCustomerId).session(session).lean();
            if (!customerExists) {
                throw CustomError.notFound(`Cliente con ID ${finalCustomerId} no encontrado al crear el pedido.`);
            }


            for (const itemDto of createOrderDto.items) {
                const product = await ProductModel.findById(itemDto.productId).session(session);
                if (!product) throw CustomError.notFound(`Producto con ID ${itemDto.productId} no encontrado`);
                if (!product.isActive) throw CustomError.badRequest(`Producto ${product.name} no disponible.`);

                const productStock = product.stock ?? 0;
                if (productStock < itemDto.quantity) {
                    throw CustomError.badRequest(`Stock insuficiente para ${product.name}. Disp: ${productStock}, Sol: ${itemDto.quantity}`);
                }

                const unitPriceWithTax = itemDto.unitPrice;
                const itemSubtotalWithTax = Math.round(itemDto.quantity * unitPriceWithTax * 100) / 100;
                const basePrice = product.price;
                const itemTaxAmount = Math.round((itemDto.quantity * basePrice * (product.taxRate / 100)) * 100) / 100;

                // <<<--- ACUMULAR VALORES --- >>>
                subtotalWithTax += itemSubtotalWithTax;
                totalTaxAmount += itemTaxAmount;
                // <<<--- FIN ACUMULAR VALORES --- >>>

                product.stock = productStock - itemDto.quantity;
                await product.save({ session });
                logger.debug(`Stock actualizado para producto ${itemDto.productId} (-${itemDto.quantity}) en sesión`, { session: session.id });

                saleItems.push({
                    product: itemDto.productId,
                    quantity: itemDto.quantity,
                    unitPrice: unitPriceWithTax,
                    subtotal: itemSubtotalWithTax
                });
            }

            if (saleItems.length === 0) throw CustomError.badRequest('La venta debe tener al menos un producto');

            // <<<--- CALCULAR DESCUENTO Y TOTAL --- >>>
            const discountRate = calculatedDiscountRate;
            const discountAmount = Math.round((subtotalWithTax * discountRate / 100) * 100) / 100;
            const finalTotal = Math.round((subtotalWithTax - discountAmount) * 100) / 100;
            // <<<--- FIN CALCULAR DESCUENTO Y TOTAL --- >>>

            if (finalTotal < 0) throw CustomError.badRequest('El total de la venta no puede ser negativo.');

            // <<<--- USAR LAS VARIABLES CALCULADAS --- >>>
            const saleData = {
                customer: finalCustomerId, // Usar el ID final
                items: saleItems,
                subtotal: subtotalWithTax,
                taxAmount: totalTaxAmount,
                discountRate: discountRate,
                discountAmount: discountAmount,
                total: finalTotal,
                notes: createOrderDto.notes || "",
                status: 'pending',
                metadata: {
                    couponCodeUsed: createOrderDto.couponCode || null
                }
            };
            // <<<--- FIN USAR LAS VARIABLES CALCULADAS --- >>>

            const saleDocArray = await OrderModel.create([saleData], { session });
            const saleDoc = saleDocArray[0];
            logger.info(`Pedido ${saleDoc._id} creado en sesión`, { session: session.id });

            if (couponIdToIncrement) {
                logger.debug(`Intentando incrementar uso para cupón ID: ${couponIdToIncrement} en sesión`, { session: session.id });
                await this.couponDataSource.incrementUsage(couponIdToIncrement, session);
                logger.info(`Uso incrementado para cupón ID: ${couponIdToIncrement} en sesión`, { session: session.id });
            }

            await session.commitTransaction();
            logger.info(`Transacción completada (commit) para pedido ${saleDoc._id}`);

            const completeSale = await this.findSaleByIdPopulated(saleDoc._id.toString());
            if (!completeSale) throw CustomError.internalServerError("No se pudo recuperar la venta creada después del commit");

            return OrderMapper.fromObjectToSaleEntity(completeSale);

        } catch (error) {
            logger.error("Error durante la transacción de creación de pedido, realizando rollback...", { error, session: session?.id });
            await session.abortTransaction();
            logger.warn(`Transacción abortada (rollback) para cliente ${finalCustomerId}`, { session: session?.id });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error interno al crear la venta: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            logger.info(`Finalizando sesión de Mongoose`, { session: session?.id });
            session.endSession();
        }
    }

    // Helper (sin cambios)
    private async findSaleByIdPopulated(id: string): Promise<any> {
        return OrderModel.findById(id)
            .populate({
                path: 'customer',
                populate: { path: 'neighborhood', populate: { path: 'city' } }
            })
            .populate({
                path: 'items.product',
                populate: [{ path: 'category' }, { path: 'unit' }]
            })
            .lean();
    }

    // ... (resto de los métodos: getAll, findById, updateStatus, etc. sin cambios) ...
    async getAll(paginationDto: PaginationDto): Promise<OrderEntity[]> {
        const { page, limit } = paginationDto;
        try {
            const salesDocs = await OrderModel.find()
                .populate({
                    path: 'customer',
                    populate: { path: 'neighborhood', populate: { path: 'city' } }
                })
                .populate({
                    path: 'items.product',
                    populate: [{ path: 'category' }, { path: 'unit' }]
                })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ date: -1 })
                .lean(); // Usar lean para eficiencia

            return salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error("Error al obtener las ventas:", { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al obtener las ventas: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findById(id: string): Promise<OrderEntity> {
        try {
            const saleDoc = await this.findSaleByIdPopulated(id);
            if (!saleDoc) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            return OrderMapper.fromObjectToSaleEntity(saleDoc);
        } catch (error) {
            logger.error(`Error al buscar la venta con ID ${id}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al buscar la venta: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();
        logger.info(`Iniciando transacción para actualizar estado de pedido ${id}`, { session: session.id });


        try {
            const sale = await OrderModel.findById(id).session(session);
            if (!sale) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            if (sale.status === updateOrderStatusDto.status) {
                logger.info(`Pedido ${id} ya tiene el estado '${updateOrderStatusDto.status}'. No se requiere actualización.`);
                await session.commitTransaction(); // Commit vacío
                const currentSaleDoc = await this.findSaleByIdPopulated(id);
                if (!currentSaleDoc) throw CustomError.internalServerError("Error al recuperar la venta sin cambios.");
                return OrderMapper.fromObjectToSaleEntity(currentSaleDoc);
            }

            if (updateOrderStatusDto.status === 'cancelled' && (sale.status === 'pending' || sale.status === 'completed')) {
                logger.info(`Pedido ${id} cancelado. Intentando restaurar stock...`, { session: session.id });
                for (const item of sale.items) {
                    const updateResult = await ProductModel.findByIdAndUpdate(
                        item.product,
                        { $inc: { stock: item.quantity } },
                        { session }
                    );
                    if (!updateResult) {
                        logger.warn(`Producto ${item.product} no encontrado durante restauración de stock para pedido ${id}. Continuando...`, { session: session.id });
                    } else {
                        logger.debug(`Stock restaurado para producto ${item.product} (+${item.quantity}) por cancelación de venta ${id}`, { session: session.id });
                    }
                }
            }

            sale.status = updateOrderStatusDto.status;
            if (updateOrderStatusDto.notes !== undefined) {
                sale.notes = updateOrderStatusDto.notes;
            }
            await sale.save({ session });
            logger.info(`Estado de pedido ${id} actualizado a ${updateOrderStatusDto.status} en sesión`, { session: session.id });

            await session.commitTransaction();
            logger.info(`Transacción completada (commit) para actualización de estado de pedido ${id}`);


            const updatedSaleDoc = await this.findSaleByIdPopulated(id);
            if (!updatedSaleDoc) throw CustomError.internalServerError("Error al recuperar la venta actualizada.");
            return OrderMapper.fromObjectToSaleEntity(updatedSaleDoc);

        } catch (error) {
            logger.error(`Error al actualizar estado de pedido ${id}, realizando rollback...`, { error, session: session?.id });
            await session.abortTransaction();
            logger.warn(`Transacción abortada (rollback) para actualización de estado de pedido ${id}`, { session: session?.id });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al actualizar estado de venta: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            logger.info(`Finalizando sesión de Mongoose para actualización de estado`, { session: session?.id });
            session.endSession();
        }
    }

    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<OrderEntity[]> {
        const { page, limit } = paginationDto;
        try {
            // Es buena idea verificar si el cliente existe primero, aunque el use case ya lo hace.
            const customer = await CustomerModel.findById(customerId);
            if (!customer) throw CustomError.notFound(`Cliente con ID ${customerId} no encontrado`);

            const salesDocs = await OrderModel.find({ customer: customerId })
                .populate({
                    path: 'customer',
                    populate: { path: 'neighborhood', populate: { path: 'city' } }
                })
                .populate({
                    path: 'items.product',
                    populate: [{ path: 'category' }, { path: 'unit' }]
                })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ date: -1 })
                .lean();

            return salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error(`Error al buscar ventas del cliente ${customerId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al buscar ventas por cliente: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<OrderEntity[]> {
        const { page, limit } = paginationDto;
        try {
            if (startDate > endDate) throw CustomError.badRequest("La fecha de inicio debe ser anterior a la fecha de fin");

            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);

            const salesDocs = await OrderModel.find({
                date: {
                    $gte: startDate,
                    $lte: endOfDay
                }
            })
                .populate({
                    path: 'customer',
                    populate: { path: 'neighborhood', populate: { path: 'city' } }
                })
                .populate({
                    path: 'items.product',
                    populate: [{ path: 'category' }, { path: 'unit' }]
                })
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ date: -1 })
                .lean();

            return salesDocs.map(doc => OrderMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error(`Error al buscar ventas por rango de fechas (${startDate.toISOString()} - ${endDate.toISOString()}):`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al buscar ventas por rango de fechas: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}