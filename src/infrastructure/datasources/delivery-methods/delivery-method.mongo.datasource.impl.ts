// src/infrastructure/datasources/delivery-methods/delivery-method.mongo.datasource.impl.ts

import { CreateDeliveryMethodDto } from '../../../domain/dtos/delivery-methods/create-delivery-method.dto';
import { UpdateDeliveryMethodDto } from '../../../domain/dtos/delivery-methods/update-delivery-method.dto';
import { DeliveryMethodEntity } from '../../../domain/entities/delivery-methods/delivery-method.entity';
import { DeliveryMethodDatasource } from '../../../domain/datasources/delivery-methods/delivery-method.datasource';
import { PaginationDto } from '../../../domain/dtos/shared/pagination.dto';
import { CustomError } from '../../../domain/errors/custom.error';
import { DeliveryMethodModel } from '../../../data/mongodb/models/delivery-method.model';
import { DeliveryMethodMapper } from '../../mappers/delivery-methods/delivery-method.mapper';

export class DeliveryMethodMongoDatasourceImpl implements DeliveryMethodDatasource {

    async create(createDeliveryMethodDto: CreateDeliveryMethodDto): Promise<DeliveryMethodEntity> {
        try {
            const deliveryMethod = await DeliveryMethodModel.create(createDeliveryMethodDto);
            return DeliveryMethodMapper.fromObjectToEntity(deliveryMethod);
        } catch (error: any) {
            if (error.code === 11000) {
                throw CustomError.badRequest(`Delivery method with code ${createDeliveryMethodDto.code} already exists`);
            }
            throw CustomError.internalServerError(`Internal server error: ${error.message}`);
        }
    }

    async getAll(paginationDto: PaginationDto): Promise<{ total: number; items: DeliveryMethodEntity[] }> {
        try {
            const { page, limit } = paginationDto;
            const skip = (page - 1) * limit;

            const [total, deliveryMethods] = await Promise.all([
                DeliveryMethodModel.countDocuments(),
                DeliveryMethodModel.find()
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
            ]);

            return {
                total,
                items: deliveryMethods.map(DeliveryMethodMapper.fromObjectToEntity)
            };
        } catch (error: any) {
            throw CustomError.internalServerError(`Internal server error: ${error.message}`);
        }
    }

    async getActiveOnes(): Promise<DeliveryMethodEntity[]> {
        try {
            console.log('🔍 [DeliveryMethodDatasource] Buscando métodos de entrega activos...');
            const deliveryMethods = await DeliveryMethodModel.find({ isActive: true })
                .sort({ name: 1 });

            console.log('📊 [DeliveryMethodDatasource] Métodos encontrados:', deliveryMethods.length);
            console.log('📋 [DeliveryMethodDatasource] Datos:', deliveryMethods);

            return deliveryMethods.map(DeliveryMethodMapper.fromObjectToEntity);
        } catch (error: any) {
            console.error('❌ [DeliveryMethodDatasource] Error:', error);
            throw CustomError.internalServerError(`Internal server error: ${error.message}`);
        }
    }

    async findById(id: string): Promise<DeliveryMethodEntity | null> {
        try {
            const deliveryMethod = await DeliveryMethodModel.findById(id);
            if (!deliveryMethod) return null;

            return DeliveryMethodMapper.fromObjectToEntity(deliveryMethod);
        } catch (error: any) {
            throw CustomError.internalServerError(`Internal server error: ${error.message}`);
        }
    }

    async findByCode(code: string): Promise<DeliveryMethodEntity | null> {
        try {
            const deliveryMethod = await DeliveryMethodModel.findOne({ code: code.toUpperCase() });
            if (!deliveryMethod) return null;

            return DeliveryMethodMapper.fromObjectToEntity(deliveryMethod);
        } catch (error: any) {
            throw CustomError.internalServerError(`Internal server error: ${error.message}`);
        }
    }

    async updateById(id: string, updateDeliveryMethodDto: UpdateDeliveryMethodDto): Promise<DeliveryMethodEntity> {
        try {
            const deliveryMethod = await DeliveryMethodModel.findByIdAndUpdate(
                id,
                updateDeliveryMethodDto,
                { new: true }
            );

            if (!deliveryMethod) {
                throw CustomError.notFound(`Delivery method with id ${id} not found`);
            }

            return DeliveryMethodMapper.fromObjectToEntity(deliveryMethod);
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            if (error.code === 11000) {
                throw CustomError.badRequest(`Delivery method with code ${updateDeliveryMethodDto.code} already exists`);
            }
            throw CustomError.internalServerError(`Internal server error: ${error.message}`);
        }
    }

    async deleteById(id: string): Promise<DeliveryMethodEntity> {
        try {
            const deliveryMethod = await DeliveryMethodModel.findByIdAndDelete(id);

            if (!deliveryMethod) {
                throw CustomError.notFound(`Delivery method with id ${id} not found`);
            }

            return DeliveryMethodMapper.fromObjectToEntity(deliveryMethod);
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError(`Internal server error: ${error.message}`);
        }
    }
}
