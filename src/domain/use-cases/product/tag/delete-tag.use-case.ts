// src/domain/use-cases/product/tag/delete-tag.use-case.ts
import { TagEntity } from "../../../entities/products/tag.entity";
import { CustomError } from "../../../errors/custom.error";
import { TagRepository } from "../../../repositories/products/tag.repository";

interface IDeleteTagUseCase {
    execute(id: string): Promise<TagEntity>;
}

export class DeleteTagUseCase implements IDeleteTagUseCase {
    constructor(private readonly repository: TagRepository) { }

    async execute(id: string): Promise<TagEntity> {
        const deletedTag = await this.repository.delete(id);
        if (!deletedTag) throw CustomError.notFound(`Tag with ID ${id} not found.`);
        // Considera la lógica si se desactivó en lugar de borrar
        return deletedTag;
    }
}