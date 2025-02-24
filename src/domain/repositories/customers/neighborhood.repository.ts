import { CreateNeighborhoodDto } from "../../dtos/customers/create-neighborhood.dto";
import { UpdateNeighborhoodDto } from "../../dtos/customers/update-neighborhood.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { NeighborhoodEntity } from "../../entities/customers/neighborhood";

export abstract class NeighborhoodRepository {
    abstract create(createNeighborhoodDto: CreateNeighborhoodDto): Promise<NeighborhoodEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<NeighborhoodEntity[]>;
    abstract findById(id: string): Promise<NeighborhoodEntity>;
    abstract update(id: string, updateNeighborhoodDto: UpdateNeighborhoodDto): Promise<NeighborhoodEntity>;
    abstract delete(id: string): Promise<NeighborhoodEntity>;
    abstract findByName(name: string, cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity>;
    abstract findByNameForCreate(name: string, cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity | null>;
    abstract findByCity(cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity[]>;
}