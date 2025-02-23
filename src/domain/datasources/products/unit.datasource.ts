import { CreateUnitDto } from "../../dtos/products/create-unit.dto";
import { UpdateUnitDto } from "../../dtos/products/udpate-unit.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { UnitEntity } from "../../entities/products/unit.entity";




export abstract class UnitDataSource {
  abstract create(createUnitDto: CreateUnitDto): Promise<UnitEntity>;
  abstract getAll(paginationDto: PaginationDto): Promise<UnitEntity[]>;
  abstract findById(id: string): Promise<UnitEntity>;
  abstract updateUnit(id: string, updateUnitDto: UpdateUnitDto):Promise<UnitEntity>;
  abstract deleteUnit(id: string): Promise<UnitEntity>;
  abstract findByName(name: string, paginationDto: PaginationDto): Promise<UnitEntity[]>;
  abstract findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<UnitEntity | null>
}