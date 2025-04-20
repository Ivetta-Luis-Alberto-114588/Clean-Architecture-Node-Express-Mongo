// src/domain/use-cases/product/tag/update-tag.use-case.ts
import { UpdateTagDto } from "../../../dtos/products/update-tag.dto";
import { TagEntity } from "../../../entities/products/tag.entity";
import { CustomError } from "../../../errors/custom.error";
import { TagRepository } from "../../../repositories/products/tag.repository";

interface IUpdateTagUseCase {
    execute(id: string, dto: UpdateTagDto): Promise<TagEntity>;
}

export class UpdateTagUseCase implements IUpdateTagUseCase {
    constructor(private readonly repository: TagRepository) { }

    async execute(id: string, dto: UpdateTagDto): Promise<TagEntity> {
        // Verificar si el nuevo nombre ya existe (si se proporciona)
        if (dto.name) {
            const existing = await this.repository.findByName(dto.name);
            if (existing && existing.id !== id) {
                throw CustomError.badRequest(`Tag name '${dto.name}' is already in use.`);
            }
        }

        const updatedTag = await this.repository.update(id, dto);
        if (!updatedTag) throw CustomError.notFound(`Tag with ID ${id} not found.`);

        return updatedTag;
    }
}