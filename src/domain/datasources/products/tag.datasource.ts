// src/domain/datasources/products/tag.datasource.ts
import { CreateTagDto } from "../../dtos/products/create-tag.dto";
import { UpdateTagDto } from "../../dtos/products/update-tag.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { TagEntity } from "../../entities/products/tag.entity";

export abstract class TagDataSource {
    abstract create(createTagDto: CreateTagDto): Promise<TagEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<TagEntity[]>;
    abstract findById(id: string): Promise<TagEntity | null>;
    abstract findByName(name: string): Promise<TagEntity | null>;
    abstract update(id: string, updateTagDto: UpdateTagDto): Promise<TagEntity | null>;
    abstract delete(id: string): Promise<TagEntity | null>; // O cambiar a desactivar
}