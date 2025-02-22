import { UnitDataSource } from "../../../domain/datasources/products/unit.datasource";
import { CreateUnitDto } from "../../../domain/dtos/products/create-unit.dto";
import { UpdateUnitDto } from "../../../domain/dtos/products/udpate-unit.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { UnitEntity } from "../../../domain/entities/products/unit.entity";
import { UnitRepository } from "../../../domain/repositories/products/unit.repository";

export class UnitRepositoryImpl implements UnitRepository{
    
    constructor(private readonly unitDatasource: UnitDataSource){}
    
    create(createUnitDto: CreateUnitDto): Promise<UnitEntity> {
        return this.unitDatasource.create(createUnitDto)        
    }

    getAll(paginationDto: PaginationDto): Promise<UnitEntity[]> {
        return this.unitDatasource.getAll(paginationDto)
    }

    findById(id: string): Promise<UnitEntity> {
        return this.unitDatasource.findById(id)
    }

    updateUnit(id: string, updateUnitDto: UpdateUnitDto): Promise<UnitEntity> {
        return this.unitDatasource.updateUnit(id, updateUnitDto)
    }

    deleteUnit(id: string): Promise<UnitEntity> {
        return this.unitDatasource.deleteUnit(id)
    }
}