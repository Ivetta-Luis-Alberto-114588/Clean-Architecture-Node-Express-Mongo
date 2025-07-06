// src/infrastructure/repositories/delivery-methods/delivery-method.repository.impl.ts

import { CreateDeliveryMethodDto } from '../../../domain/dtos/delivery-methods/create-delivery-method.dto';
import { UpdateDeliveryMethodDto } from '../../../domain/dtos/delivery-methods/update-delivery-method.dto';
import { DeliveryMethodEntity } from '../../../domain/entities/delivery-methods/delivery-method.entity';
import { DeliveryMethodRepository } from '../../../domain/repositories/delivery-methods/delivery-method.repository';
import { DeliveryMethodDatasource } from '../../../domain/datasources/delivery-methods/delivery-method.datasource';
import { PaginationDto } from '../../../domain/dtos/shared/pagination.dto';

export class DeliveryMethodRepositoryImpl implements DeliveryMethodRepository {

    constructor(
        private readonly datasource: DeliveryMethodDatasource
    ) { }

    async create(createDeliveryMethodDto: CreateDeliveryMethodDto): Promise<DeliveryMethodEntity> {
        return await this.datasource.create(createDeliveryMethodDto);
    }

    async getAll(paginationDto: PaginationDto): Promise<{ total: number; items: DeliveryMethodEntity[] }> {
        return await this.datasource.getAll(paginationDto);
    }

    async getActiveOnes(): Promise<DeliveryMethodEntity[]> {
        return await this.datasource.getActiveOnes();
    }

    async findById(id: string): Promise<DeliveryMethodEntity | null> {
        return await this.datasource.findById(id);
    }

    async findByCode(code: string): Promise<DeliveryMethodEntity | null> {
        return await this.datasource.findByCode(code);
    }

    async updateById(id: string, updateDeliveryMethodDto: UpdateDeliveryMethodDto): Promise<DeliveryMethodEntity> {
        return await this.datasource.updateById(id, updateDeliveryMethodDto);
    }

    async deleteById(id: string): Promise<DeliveryMethodEntity> {
        return await this.datasource.deleteById(id);
    }
}
