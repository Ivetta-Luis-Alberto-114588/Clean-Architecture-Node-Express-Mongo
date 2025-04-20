// src/infrastructure/datasources/products/tag.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { TagModel, ITag } from "../../../data/mongodb/models/products/tag.model";
import { TagDataSource } from "../../../domain/datasources/products/tag.datasource";
import { CreateTagDto } from "../../../domain/dtos/products/create-tag.dto";
import { UpdateTagDto } from "../../../domain/dtos/products/update-tag.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { TagEntity } from "../../../domain/entities/products/tag.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { TagMapper } from "../../../infrastructure/mappers/products/tag.mapper";
import logger from "../../../configs/logger";

export class TagMongoDataSourceImpl implements TagDataSource {

    async create(createTagDto: CreateTagDto): Promise<TagEntity> {
        try {
            const existingTag = await TagModel.findOne({ name: createTagDto.name });
            if (existingTag) throw CustomError.badRequest(`Tag '${createTagDto.name}' already exists.`);

            const tag = await TagModel.create(createTagDto);
            logger.info(`Tag created: ${tag.name} (ID: ${tag._id})`);
            return TagMapper.fromObjectToTagEntity(tag);
        } catch (error: any) {
            logger.error("Error creating tag:", { error, dto: createTagDto });
            if (error.code === 11000) throw CustomError.badRequest(`Tag '${createTagDto.name}' already exists.`);
            if (error instanceof mongoose.Error.ValidationError) throw CustomError.badRequest(`Validation Error: ${error.message}`);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error creating tag.");
        }
    }

    async getAll(paginationDto: PaginationDto): Promise<TagEntity[]> {
        const { page, limit } = paginationDto;
        try {
            const tags = await TagModel.find()
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ name: 1 }); // Ordenar alfabéticamente por defecto
            return tags.map(TagMapper.fromObjectToTagEntity);
        } catch (error) {
            logger.error("Error getting all tags:", { error });
            throw CustomError.internalServerError("Error getting tags.");
        }
    }

    async findById(id: string): Promise<TagEntity | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return null;
            const tag = await TagModel.findById(id);
            if (!tag) return null;
            return TagMapper.fromObjectToTagEntity(tag);
        } catch (error) {
            logger.error(`Error finding tag by ID ${id}:`, { error });
            throw CustomError.internalServerError("Error finding tag by ID.");
        }
    }

    async findByName(name: string): Promise<TagEntity | null> {
        try {
            const tag = await TagModel.findOne({ name: name.toLowerCase() });
            if (!tag) return null;
            return TagMapper.fromObjectToTagEntity(tag);
        } catch (error) {
            logger.error(`Error finding tag by name ${name}:`, { error });
            throw CustomError.internalServerError("Error finding tag by name.");
        }
    }

    async update(id: string, updateTagDto: UpdateTagDto): Promise<TagEntity | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return null;

            // Verificar si el nuevo nombre ya existe en OTRO tag
            if (updateTagDto.name) {
                const existingTag = await TagModel.findOne({ name: updateTagDto.name, _id: { $ne: id } });
                if (existingTag) throw CustomError.badRequest(`Tag name '${updateTagDto.name}' is already in use.`);
            }

            const updateFields: Partial<ITag> = {};
            if (updateTagDto.name !== undefined) updateFields.name = updateTagDto.name;
            if ('description' in updateTagDto) updateFields.description = updateTagDto.description ?? undefined; // Set to undefined if null
            if (updateTagDto.isActive !== undefined) updateFields.isActive = updateTagDto.isActive;

            if (Object.keys(updateFields).length === 0) {
                logger.warn(`Attempt to update tag ${id} with no changes.`);
                return this.findById(id); // Return existing if no changes
            }

            const updatedTag = await TagModel.findByIdAndUpdate(
                id,
                { $set: updateFields },
                { new: true, runValidators: true }
            );

            if (!updatedTag) return null;
            logger.info(`Tag updated: ${updatedTag.name} (ID: ${id})`);
            return TagMapper.fromObjectToTagEntity(updatedTag);
        } catch (error: any) {
            logger.error(`Error updating tag ${id}:`, { error, dto: updateTagDto });
            if (error.code === 11000) throw CustomError.badRequest(`Tag name '${updateTagDto.name}' is already in use.`);
            if (error instanceof mongoose.Error.ValidationError) throw CustomError.badRequest(`Validation Error: ${error.message}`);
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error updating tag.");
        }
    }

    async delete(id: string): Promise<TagEntity | null> {
        // Considerar cambiar a desactivar (isActive: false)
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return null;
            // const deletedTag = await TagModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
            const deletedTag = await TagModel.findByIdAndDelete(id);
            if (!deletedTag) return null;
            logger.info(`Tag deleted (or deactivated): ${deletedTag.name} (ID: ${id})`);
            // TODO: Considerar quitar la etiqueta de los productos que la tuvieran
            // await ProductModel.updateMany({ tags: deletedTag.name }, { $pull: { tags: deletedTag.name } });
            return TagMapper.fromObjectToTagEntity(deletedTag);
        } catch (error) {
            logger.error(`Error deleting tag ${id}:`, { error });
            throw CustomError.internalServerError("Error deleting tag.");
        }
    }
}