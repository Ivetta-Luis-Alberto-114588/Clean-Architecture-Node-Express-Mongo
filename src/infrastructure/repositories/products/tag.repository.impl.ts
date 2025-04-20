// src/infrastructure/repositories/products/tag.repository.impl.ts
import { TagDataSource } from "../../../domain/datasources/products/tag.datasource";
import { CreateTagDto } from "../../../domain/dtos/products/create-tag.dto";
import { UpdateTagDto } from "../../../domain/dtos/products/update-tag.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { TagEntity } from "../../../domain/entities/products/tag.entity";
import { TagRepository } from "../../../domain/repositories/products/tag.repository";

export class TagRepositoryImpl implements TagRepository {
    constructor(private readonly tagDataSource: TagDataSource) { }

    create(createTagDto: CreateTagDto): Promise<TagEntity> {
        return this.tagDataSource.create(createTagDto);
    }
    getAll(paginationDto: PaginationDto): Promise<TagEntity[]> {
        return this.tagDataSource.getAll(paginationDto);
    }
    findById(id: string): Promise<TagEntity | null> {
        return this.tagDataSource.findById(id);
    }
    findByName(name: string): Promise<TagEntity | null> {
        return this.tagDataSource.findByName(name);
    }
    update(id: string, updateTagDto: UpdateTagDto): Promise<TagEntity | null> {
        return this.tagDataSource.update(id, updateTagDto);
    }
    delete(id: string): Promise<TagEntity | null> {
        return this.tagDataSource.delete(id);
    }
}