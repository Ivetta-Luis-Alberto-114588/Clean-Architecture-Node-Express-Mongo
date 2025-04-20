// src/infrastructure/mappers/products/tag.mapper.ts
import { TagEntity } from "../../../domain/entities/products/tag.entity";
import { CustomError } from "../../../domain/errors/custom.error";

export class TagMapper {
    static fromObjectToTagEntity(object: { [key: string]: any }): TagEntity {
        const { _id, id, name, description, isActive, createdAt, updatedAt } = object;

        if (!_id && !id) throw CustomError.badRequest('TagMapper: missing id');
        if (!name) throw CustomError.badRequest('TagMapper: missing name');

        return new TagEntity(
            _id?.toString() || id?.toString(),
            name,
            description,
            isActive ?? true,
            createdAt ? new Date(createdAt) : undefined,
            updatedAt ? new Date(updatedAt) : undefined
        );
    }
}