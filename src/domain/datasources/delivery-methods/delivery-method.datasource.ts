// src/domain/datasources/delivery-methods/delivery-method.datasource.ts

import { CreateDeliveryMethodDto } from '../../dtos/delivery-methods/create-delivery-method.dto';
import { UpdateDeliveryMethodDto } from '../../dtos/delivery-methods/update-delivery-method.dto';
import { DeliveryMethodEntity } from '../../entities/delivery-methods/delivery-method.entity';
import { PaginationDto } from '../../dtos/shared/pagination.dto';

export abstract class DeliveryMethodDatasource {
    abstract create(createDeliveryMethodDto: CreateDeliveryMethodDto): Promise<DeliveryMethodEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<{ total: number; items: DeliveryMethodEntity[] }>;
    abstract getActiveOnes(): Promise<DeliveryMethodEntity[]>;
    abstract findById(id: string): Promise<DeliveryMethodEntity | null>;
    abstract findByCode(code: string): Promise<DeliveryMethodEntity | null>;
    abstract updateById(id: string, updateDeliveryMethodDto: UpdateDeliveryMethodDto): Promise<DeliveryMethodEntity>;
    abstract deleteById(id: string): Promise<DeliveryMethodEntity>;
}
