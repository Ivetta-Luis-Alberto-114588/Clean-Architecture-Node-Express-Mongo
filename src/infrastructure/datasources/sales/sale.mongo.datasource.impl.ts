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
import { PriceCalculator } from "../../../configs/price-calculator";

export class SaleMongoDataSourceImpl implements SaleDataSource {
    async create(createSaleDto: CreateSaleDto): Promise<SaleEntity> {
        // Iniciar una sesión para la transacción
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Calcular totales
            let subtotal = 0;
            const saleItems = [];

            // Procesar cada item y calcular subtotales
            for (const item of createSaleDto.items) {
                const itemSubtotal = item.quantity * item.unitPrice;
                subtotal += itemSubtotal;

                saleItems.push({
                    product: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: itemSubtotal
                });
            }            // Calcular montos con el flujo correcto: descuento primero, luego IVA
            // Nota: Para Sales el descuento se aplica al total general, no por item
            const subtotalAfterDiscount = Math.round((subtotal * (1 - createSaleDto.discountRate / 100)) * 100) / 100;
            const taxAmount = Math.round((subtotalAfterDiscount * createSaleDto.taxRate / 100) * 100) / 100;
            const discountAmount = Math.round((subtotal * createSaleDto.discountRate / 100) * 100) / 100;
            const total = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;

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
                }); if (!completeSale) {
                    throw CustomError.internalServerError("Error retrieving created sale");
                }

            return SaleMapper.fromObjectToSaleEntity(completeSale);

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } async getAll(paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        const [sales, total] = await Promise.all([
            SaleModel.find()
                .skip(skip)
                .limit(limit)
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
                .sort({ date: -1 }), // Ordenar por fecha, más recientes primero
            SaleModel.countDocuments()
        ]);

        return {
            total,
            sales: sales.map(sale => SaleMapper.fromObjectToSaleEntity(sale))
        };
    } async findById(id: string): Promise<SaleEntity> {
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
            throw CustomError.notFound(`Sale with id ${id} not found`);
        }

        return SaleMapper.fromObjectToSaleEntity(sale);
    }

    async updateStatus(id: string, updateSaleStatusDto: UpdateSaleStatusDto): Promise<SaleEntity> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Buscar la venta
            const sale = await SaleModel.findById(id).session(session);
            if (!sale) {
                throw CustomError.notFound(`Sale with id ${id} not found`);
            }

            // Preparar datos de actualización
            const updateData: any = {
                status: updateSaleStatusDto.status
            };

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
                }); if (!updatedSale) {
                    throw CustomError.internalServerError("Error updating sale");
                }

            await session.commitTransaction();
            session.endSession();

            return SaleMapper.fromObjectToSaleEntity(updatedSale);

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    } async findByCustomer(customerId: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        const [sales, total] = await Promise.all([
            SaleModel.find({ customer: customerId })
                .skip(skip)
                .limit(limit)
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
                .sort({ date: -1 }),
            SaleModel.countDocuments({ customer: customerId })
        ]);

        return {
            total,
            sales: sales.map(sale => SaleMapper.fromObjectToSaleEntity(sale))
        };
    } async findByDateRange(startDate: Date, endDate: Date, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        const query = {
            date: {
                $gte: startDate,
                $lte: endDate
            }
        };

        const [sales, total] = await Promise.all([
            SaleModel.find(query)
                .skip(skip)
                .limit(limit)
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
                .sort({ date: -1 }),
            SaleModel.countDocuments(query)
        ]);

        return {
            total,
            sales: sales.map(sale => SaleMapper.fromObjectToSaleEntity(sale))
        };
    } async findByStatus(status: string, paginationDto: PaginationDto): Promise<{ total: number; sales: SaleEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        const query = { status };

        const [sales, total] = await Promise.all([
            SaleModel.find(query)
                .skip(skip)
                .limit(limit)
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
                .sort({ date: -1 }),
            SaleModel.countDocuments(query)
        ]);

        return {
            total,
            sales: sales.map(sale => SaleMapper.fromObjectToSaleEntity(sale))
        };
    }
}
