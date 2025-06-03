// src/infrastructure/datasources/payment/payment-method.mongo.datasource.impl.ts

import mongoose from "mongoose";
import { PaymentMethodDataSource } from "../../../domain/datasources/payment/payment-method.datasource";
import { CreatePaymentMethodDto } from "../../../domain/dtos/payment/create-payment-method.dto";
import { UpdatePaymentMethodDto } from "../../../domain/dtos/payment/update-payment-method.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { PaymentMethodEntity } from "../../../domain/entities/payment/payment-method.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { PaymentMethodModel } from "../../../data/mongodb/models/payment/payment-method.model";
import logger from "../../../configs/logger";

export class PaymentMethodMongoDataSourceImpl implements PaymentMethodDataSource {

    async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity> {
        try {
            // Verificar que el código no exista
            const existingMethod = await PaymentMethodModel.findOne({ code: createPaymentMethodDto.code });
            if (existingMethod) {
                throw CustomError.badRequest(`Payment method with code '${createPaymentMethodDto.code}' already exists`);
            }

            // Verificar que el defaultOrderStatusId existe
            const orderStatusExists = await mongoose.connection.db.collection('orderstatuses').findOne({
                _id: new mongoose.Types.ObjectId(createPaymentMethodDto.defaultOrderStatusId)
            });
            if (!orderStatusExists) {
                throw CustomError.badRequest('Default order status not found');
            }

            const paymentMethod = new PaymentMethodModel(createPaymentMethodDto);
            await paymentMethod.save();

            logger.info(`Payment method created: ${paymentMethod.code}`);
            return PaymentMethodEntity.fromObject(paymentMethod);

        } catch (error) {
            logger.error('Error creating payment method:', error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error creating payment method');
        }
    }

    async getAll(paginationDto: PaginationDto, activeOnly?: boolean): Promise<{ total: number; paymentMethods: PaymentMethodEntity[] }> {
        try {
            const { page, limit } = paginationDto;
            const skip = (page - 1) * limit;

            const filter = activeOnly ? { isActive: true } : {};

            const [paymentMethods, total] = await Promise.all([
                PaymentMethodModel.find(filter)
                    .populate('defaultOrderStatusId', 'code name description color')
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                PaymentMethodModel.countDocuments(filter)
            ]);

            return {
                total,
                paymentMethods: paymentMethods.map(PaymentMethodEntity.fromObject)
            };

        } catch (error) {
            logger.error('Error getting payment methods:', error);
            throw CustomError.internalServerError('Error retrieving payment methods');
        }
    }

    async findById(id: string): Promise<PaymentMethodEntity | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return null;
            }

            const paymentMethod = await PaymentMethodModel.findById(id)
                .populate('defaultOrderStatusId', 'code name description color');
            
            return paymentMethod ? PaymentMethodEntity.fromObject(paymentMethod) : null;

        } catch (error) {
            logger.error(`Error finding payment method by id ${id}:`, error);
            throw CustomError.internalServerError('Error finding payment method');
        }
    }

    async findByCode(code: string): Promise<PaymentMethodEntity | null> {
        try {
            const paymentMethod = await PaymentMethodModel.findOne({ code: code.toUpperCase() })
                .populate('defaultOrderStatusId', 'code name description color');
            
            return paymentMethod ? PaymentMethodEntity.fromObject(paymentMethod) : null;

        } catch (error) {
            logger.error(`Error finding payment method by code ${code}:`, error);
            throw CustomError.internalServerError('Error finding payment method');
        }
    }

    async update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethodEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw CustomError.badRequest('Invalid payment method ID');
            }

            // Verificar que existe
            const existingMethod = await PaymentMethodModel.findById(id);
            if (!existingMethod) {
                throw CustomError.notFound('Payment method not found');
            }

            // Si se está actualizando el código, verificar que no exista otro
            if (updatePaymentMethodDto.code && updatePaymentMethodDto.code !== existingMethod.code) {
                const methodWithCode = await PaymentMethodModel.findOne({ 
                    code: updatePaymentMethodDto.code,
                    _id: { $ne: id }
                });
                if (methodWithCode) {
                    throw CustomError.badRequest(`Payment method with code '${updatePaymentMethodDto.code}' already exists`);
                }
            }

            // Verificar que el defaultOrderStatusId existe si se está actualizando
            if (updatePaymentMethodDto.defaultOrderStatusId) {
                const orderStatusExists = await mongoose.connection.db.collection('orderstatuses').findOne({
                    _id: new mongoose.Types.ObjectId(updatePaymentMethodDto.defaultOrderStatusId)
                });
                if (!orderStatusExists) {
                    throw CustomError.badRequest('Default order status not found');
                }
            }

            const updatedMethod = await PaymentMethodModel.findByIdAndUpdate(
                id,
                updatePaymentMethodDto,
                { new: true, runValidators: true }
            ).populate('defaultOrderStatusId', 'code name description color');

            logger.info(`Payment method updated: ${updatedMethod!.code}`);
            return PaymentMethodEntity.fromObject(updatedMethod!);

        } catch (error) {
            logger.error(`Error updating payment method ${id}:`, error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error updating payment method');
        }
    }

    async delete(id: string): Promise<PaymentMethodEntity> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw CustomError.badRequest('Invalid payment method ID');
            }

            const deletedMethod = await PaymentMethodModel.findByIdAndDelete(id);
            if (!deletedMethod) {
                throw CustomError.notFound('Payment method not found');
            }

            logger.info(`Payment method deleted: ${deletedMethod.code}`);
            return PaymentMethodEntity.fromObject(deletedMethod);

        } catch (error) {
            logger.error(`Error deleting payment method ${id}:`, error);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError('Error deleting payment method');
        }
    }

    async findActive(): Promise<PaymentMethodEntity[]> {
        try {
            const paymentMethods = await PaymentMethodModel.find({ isActive: true })
                .populate('defaultOrderStatusId', 'code name description color')
                .sort({ createdAt: -1 });

            return paymentMethods.map(PaymentMethodEntity.fromObject);

        } catch (error) {
            logger.error('Error getting active payment methods:', error);
            throw CustomError.internalServerError('Error retrieving active payment methods');
        }
    }
}
