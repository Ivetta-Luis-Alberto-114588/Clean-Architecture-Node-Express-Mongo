// src/domain/use-cases/product/tag/create-tag.use-case.ts
import { CreateTagDto } from "../../../dtos/products/create-tag.dto"
import { TagEntity } from "../../../entities/products/tag.entity";
import { CustomError } from "../../../errors/custom.error";
import { TagRepository } from "../../../repositories/products/tag.repository";

interface ICreateTagUseCase {
    execute(dto: CreateTagDto): Promise<TagEntity>;
}

export class CreateTagUseCase implements ICreateTagUseCase {
    constructor(private readonly repository: TagRepository) { }

    async execute(dto: CreateTagDto): Promise<TagEntity> {
        const existingTag = await this.repository.findByName(dto.name);
        if (existingTag) throw CustomError.badRequest(`Tag '${dto.name}' already exists.`);

        return this.repository.create(dto);
    }
}