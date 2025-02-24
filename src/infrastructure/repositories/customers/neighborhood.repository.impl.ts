// src/infrastructure/repositories/customers/neighborhood.repository.impl.ts
import { NeighborhoodDataSource } from "../../../domain/datasources/customers/neighborhood.datasource";
import { CreateNeighborhoodDto } from "../../../domain/dtos/customers/create-neighborhood.dto";
import { UpdateNeighborhoodDto } from "../../../domain/dtos/customers/update-neighborhood.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { NeighborhoodEntity } from "../../../domain/entities/customers/neighborhood";
import { NeighborhoodRepository } from "../../../domain/repositories/customers/neighborhood.repository";

export class NeighborhoodRepositoryImpl implements NeighborhoodRepository {
    
    constructor(private readonly neighborhoodDataSource: NeighborhoodDataSource) {}
    
    create(createNeighborhoodDto: CreateNeighborhoodDto): Promise<NeighborhoodEntity> {
        return this.neighborhoodDataSource.create(createNeighborhoodDto);
    }
    
    getAll(paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
        return this.neighborhoodDataSource.getAll(paginationDto);
    }
    
    findById(id: string): Promise<NeighborhoodEntity> {
        return this.neighborhoodDataSource.findById(id);
    }
    
    update(id: string, updateNeighborhoodDto: UpdateNeighborhoodDto): Promise<NeighborhoodEntity> {
        return this.neighborhoodDataSource.update(id, updateNeighborhoodDto);
    }
    
    delete(id: string): Promise<NeighborhoodEntity> {
        return this.neighborhoodDataSource.delete(id);
    }
    
    findByName(name: string, cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity> {
        return this.neighborhoodDataSource.findByName(name, cityId, paginationDto);
    }
    
    findByNameForCreate(name: string, cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity | null> {
        return this.neighborhoodDataSource.findByNameForCreate(name, cityId, paginationDto);
    }
    
    findByCity(cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
        return this.neighborhoodDataSource.findByCity(cityId, paginationDto);
    }
}