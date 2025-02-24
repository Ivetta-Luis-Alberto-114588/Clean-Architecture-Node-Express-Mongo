// src/infrastructure/repositories/customers/city.repository.impl.ts
import { CityDataSource } from "../../../domain/datasources/customers/city.datasource";
import { CreateCityDto } from "../../../domain/dtos/customers/create-city.dto";
import { UpdateCityDto } from "../../../domain/dtos/customers/update-city.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CityEntity } from "../../../domain/entities/customers/citiy";
import { CityRepository } from "../../../domain/repositories/customers/city.repository";

export class CityRepositoryImpl implements CityRepository {
    
    constructor(private readonly cityDataSource: CityDataSource) {}
    
    create(createCityDto: CreateCityDto): Promise<CityEntity> {
        return this.cityDataSource.create(createCityDto);
    }
    
    getAll(paginationDto: PaginationDto): Promise<CityEntity[]> {
        return this.cityDataSource.getAll(paginationDto);
    }
    
    findById(id: string): Promise<CityEntity> {
        return this.cityDataSource.findById(id);
    }
    
    update(id: string, updateCityDto: UpdateCityDto): Promise<CityEntity> {
        return this.cityDataSource.update(id, updateCityDto);
    }
    
    delete(id: string): Promise<CityEntity> {
        return this.cityDataSource.delete(id);
    }
    
    findByName(name: string, paginationDto: PaginationDto): Promise<CityEntity> {
        return this.cityDataSource.findByName(name, paginationDto);
    }
    
    findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<CityEntity | null> {
        return this.cityDataSource.findByNameForCreate(name, paginationDto);
    }
}