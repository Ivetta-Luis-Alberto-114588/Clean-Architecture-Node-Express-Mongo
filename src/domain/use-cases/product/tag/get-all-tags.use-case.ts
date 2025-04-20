// src/domain/use-cases/product/tag/get-all-tags.use-case.ts
import { PaginationDto } from "../../../dtos/shared/pagination.dto";
import { TagEntity } from "../../../entities/products/tag.entity";
import { TagRepository } from "../../../repositories/products/tag.repository";

interface IGetAllTagsUseCase {
    execute(paginationDto: PaginationDto): Promise<TagEntity[]>;
}

export class GetAllTagsUseCase implements IGetAllTagsUseCase {
    constructor(private readonly repository: TagRepository) { }

    async execute(paginationDto: PaginationDto): Promise<TagEntity[]> {
        return this.repository.getAll(paginationDto);
    }
}