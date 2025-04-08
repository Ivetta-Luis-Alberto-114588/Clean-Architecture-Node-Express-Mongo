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
import logger from "../../../configs/logger"; // Importar Logger

export class SaleMongoDataSourceImpl implements SaleDataSource {
    async create(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const customer = await CustomerModel.findById(createSaleDto.customerId).session(session);
            if (!customer) throw CustomError.notFound(`Cliente con ID ${createSaleDto.customerId} no encontrado`);

            const saleItems = [];
            let subtotalWithTax = 0; // Subtotal acumulado CON IVA
            let totalTaxAmount = 0;  // IVA total acumulado

            for (const itemDto of createSaleDto.items) {
                const product = await ProductModel.findById(itemDto.productId).session(session);
                if (!product) throw CustomError.notFound(`Producto con ID ${itemDto.productId} no encontrado`);
                if (!product.isActive) throw CustomError.badRequest(`Producto ${product.name} no disponible.`);

                const productStock = product.stock ?? 0; // Usar 0 si es undefined
                if (productStock < itemDto.quantity) {
                    throw CustomError.badRequest(`Stock insuficiente para ${product.name}. Disp: ${productStock}, Sol: ${itemDto.quantity}`);
                }

                // Precio unitario CON IVA (viene del DTO o lo calculamos)
                // Idealmente el DTO ya lo trae calculado desde el carrito/frontend
                const unitPriceWithTax = itemDto.unitPrice;

                // Calculamos el subtotal del item CON IVA
                const itemSubtotalWithTax = Math.round(itemDto.quantity * unitPriceWithTax * 100) / 100;

                // Calculamos el IVA de este item
                const basePrice = product.price; // Precio sin IVA del producto
                const itemTaxAmount = Math.round((itemDto.quantity * basePrice * (product.taxRate / 100)) * 100) / 100;

                // Acumulamos totales
                subtotalWithTax += itemSubtotalWithTax;
                totalTaxAmount += itemTaxAmount;

                // Actualizar stock
                product.stock = productStock - itemDto.quantity;
                await product.save({ session });

                saleItems.push({
                    product: itemDto.productId,
                    quantity: itemDto.quantity,
                    unitPrice: unitPriceWithTax, // Guardamos precio CON IVA
                    subtotal: itemSubtotalWithTax // Guardamos subtotal CON IVA
                    // Opcional: taxRateApplied: product.taxRate
                });
            }

            if (saleItems.length === 0) throw CustomError.badRequest('La venta debe tener al menos un producto');

            // Calcular descuento (sobre el subtotal CON IVA)
            const discountRate = createSaleDto.discountRate ?? 0;
            const discountAmount = Math.round((subtotalWithTax * discountRate / 100) * 100) / 100;
            const finalTotal = Math.round((subtotalWithTax - discountAmount) * 100) / 100;

            if (finalTotal < 0) throw CustomError.badRequest('El total de la venta no puede ser negativo.');

            // Crear la venta
            const saleData = {
                customer: createSaleDto.customerId,
                items: saleItems,
                subtotal: subtotalWithTax, // Subtotal CON IVA
                taxAmount: totalTaxAmount,   // IVA total calculado
                discountRate: discountRate,
                discountAmount: discountAmount,
                total: finalTotal,
                notes: createSaleDto.notes || "",
                status: 'pending'
                // taxRate global podría guardarse si se aplica un impuesto adicional general
            };

            const saleDoc = await SaleModel.create([saleData], { session });
            await session.commitTransaction();

            // Log éxito
            logger.info(`Venta creada exitosamente ID: ${saleDoc[0]._id}`);

            // Obtener la venta completa con populate
            const completeSale = await this.findSaleByIdPopulated(saleDoc[0]._id.toString());
            if (!completeSale) throw CustomError.internalServerError("No se pudo recuperar la venta creada");

            return SaleMapper.fromObjectToSaleEntity(completeSale); // Usar Mapper

        } catch (error) {
            await session.abortTransaction();
            logger.error("Error al crear la venta:", { error }); // Log detallado del error
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error interno al crear la venta: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            session.endSession();
        }
    }

    // Helper para poblar consistentemente
    private async findSaleByIdPopulated(id: string): Promise<any> { // Devuelve any para que el mapper trabaje
        return SaleModel.findById(id)
            .populate({
                path: 'customer',
                populate: { path: 'neighborhood', populate: { path: 'city' } }
            })
            .populate({
                path: 'items.product',
                populate: [{ path: 'category' }, { path: 'unit' }]
            })
            .lean(); // Usar lean puede ser más eficiente si solo lees
    }


    async getAll(paginationDto: PaginationDto): Promise<SaleEntity[]> {
        const { page, limit } = paginationDto;
        try {
            const salesDocs = await SaleModel.find()
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

            return salesDocs.map(doc => SaleMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error("Error al obtener las ventas:", { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al obtener las ventas: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findById(id: string): Promise<SaleEntity> {
        try {
            const saleDoc = await this.findSaleByIdPopulated(id);
            if (!saleDoc) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            return SaleMapper.fromObjectToSaleEntity(saleDoc);
        } catch (error) {
            logger.error(`Error al buscar la venta con ID ${id}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al buscar la venta: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // --- updateStatus, findByCustomer, findByDateRange (requieren ajustes menores o usar el helper findSaleByIdPopulated) ---

    async updateStatus(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const sale = await SaleModel.findById(id).session(session);
            if (!sale) throw CustomError.notFound(`Venta con ID ${id} no encontrada`);
            if (sale.status === updateSaleStatusDto.status) {
                throw CustomError.badRequest(`La venta ya tiene el estado '${updateSaleStatusDto.status}'`);
            }

            // Restaurar stock si se cancela
            if (updateSaleStatusDto.status === 'cancelled' && (sale.status === 'pending' || sale.status === 'completed')) {
                for (const item of sale.items) {
                    // Sumar de nuevo la cantidad al stock del producto
                    await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }).session(session);
                    logger.debug(`Stock restaurado para producto ${item.product} (+${item.quantity}) por cancelación de venta ${id}`);
                }
            }

            // Actualizar venta
            sale.status = updateSaleStatusDto.status;
            if (updateSaleStatusDto.notes !== undefined) {
                sale.notes = updateSaleStatusDto.notes;
            }
            await sale.save({ session });
            await session.commitTransaction();
            logger.info(`Estado de venta ${id} actualizado a ${updateSaleStatusDto.status}`);

            const updatedSaleDoc = await this.findSaleByIdPopulated(id);
            if (!updatedSaleDoc) throw CustomError.internalServerError("Error al recuperar la venta actualizada.");
            return SaleMapper.fromObjectToSaleEntity(updatedSaleDoc);

        } catch (error) {
            await session.abortTransaction();
            logger.error(`Error al actualizar estado de venta ${id}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al actualizar estado de venta: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            session.endSession();
        }
    }

    async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<SaleEntity[]> {
        const { page, limit } = paginationDto;
        try {
            const customer = await CustomerModel.findById(customerId);
            if (!customer) throw CustomError.notFound(`Cliente con ID ${customerId} no encontrado`);

            const salesDocs = await SaleModel.find({ customer: customerId })
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

            return salesDocs.map(doc => SaleMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error(`Error al buscar ventas del cliente ${customerId}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al buscar ventas por cliente: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<SaleEntity[]> {
        const { page, limit } = paginationDto;
        try {
            if (startDate > endDate) throw CustomError.badRequest("La fecha de inicio debe ser anterior a la fecha de fin");

            const salesDocs = await SaleModel.find({ date: { $gte: startDate, $lte: endDate } })
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

            return salesDocs.map(doc => SaleMapper.fromObjectToSaleEntity(doc));
        } catch (error) {
            logger.error(`Error al buscar ventas por rango de fechas:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Error al buscar ventas por rango de fechas: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}