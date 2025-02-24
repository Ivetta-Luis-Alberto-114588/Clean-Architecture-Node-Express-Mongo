import { CreateCityDto } from "../../dtos/customers/create-city.dto";
import { UpdateCityDto } from "../../dtos/customers/update-city.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CityEntity } from "../../entities/customers/citiy";

export abstract class CityRepository {
    abstract create(createCityDto: CreateCityDto): Promise<CityEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<CityEntity[]>;
    abstract findById(id: string): Promise<CityEntity>;
    abstract update(id: string, updateCityDto: UpdateCityDto): Promise<CityEntity>;
    abstract delete(id: string): Promise<CityEntity>;
    abstract findByName(name: string, paginationDto: PaginationDto): Promise<CityEntity>;
    abstract findByNameForCreate(name: string, paginationDto: PaginationDto): Promise<CityEntity | null>;
}