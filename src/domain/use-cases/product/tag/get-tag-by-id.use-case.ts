// src/domain/use-cases/product/tag/get-tag-by-id.use-case.ts
import { TagEntity } from "../../../entities/products/tag.entity";
import { CustomError } from "../../../errors/custom.error";
import { TagRepository } from "../../../repositories/products/tag.repository";

interface IGetTagByIdUseCase {
    execute(id: string): Promise<TagEntity>;
}

export class GetTagByIdUseCase implements IGetTagByIdUseCase {
    constructor(private readonly repository: TagRepository) { }

    async execute(id: string): Promise<TagEntity> {
        const tag = await this.repository.findById(id);
        if (!tag) throw CustomError.notFound(`Tag with ID ${id} not found.`);
        return tag;
    }
}