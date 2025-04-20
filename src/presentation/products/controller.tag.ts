// src/presentation/products/controller.tag.ts
import { Request, Response } from "express";
import { CustomError } from "../../domain/errors/custom.error";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { CreateTagDto } from "../../domain/dtos/products/create-tag.dto";
import { UpdateTagDto } from "../../domain/dtos/products/update-tag.dto";
import { TagRepository } from "../../domain/repositories/products/tag.repository";
import { CreateTagUseCase } from "../../domain/use-cases/product/tag/create-tag.use-case";
import { GetAllTagsUseCase } from "../../domain/use-cases/product/tag/get-all-tags.use-case";
import { GetTagByIdUseCase } from "../../domain/use-cases/product/tag/get-tag-by-id.use-case";
import { UpdateTagUseCase } from "../../domain/use-cases/product/tag/update-tag.use-case";
import { DeleteTagUseCase } from "../../domain/use-cases/product/tag/delete-tag.use-case";
import logger from "../../configs/logger";

export class TagController {

    constructor(private readonly repository: TagRepository) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error("Error en TagController:", { error });
        return res.status(500).json({ error: "Internal server error" });
    }

    createTag = (req: Request, res: Response) => {
        const [error, createTagDto] = CreateTagDto.create(req.body);
        if (error) return res.status(400).json({ error });

        new CreateTagUseCase(this.repository)
            .execute(createTagDto!)
            .then(tag => res.status(201).json(tag))
            .catch(err => this.handleError(err, res));
    }

    getAllTags = (req: Request, res: Response) => {
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
        if (error) return res.status(400).json({ error });

        new GetAllTagsUseCase(this.repository)
            .execute(paginationDto!)
            .then(tags => res.json(tags))
            .catch(err => this.handleError(err, res));
    }

    getTagById = (req: Request, res: Response) => {
        const { id } = req.params;
        new GetTagByIdUseCase(this.repository)
            .execute(id)
            .then(tag => res.json(tag))
            .catch(err => this.handleError(err, res));
    }

    updateTag = (req: Request, res: Response) => {
        const { id } = req.params;
        const [error, updateTagDto] = UpdateTagDto.update(req.body);
        if (error) return res.status(400).json({ error });

        new UpdateTagUseCase(this.repository)
            .execute(id, updateTagDto!)
            .then(tag => res.json(tag))
            .catch(err => this.handleError(err, res));
    }

    deleteTag = (req: Request, res: Response) => {
        const { id } = req.params;
        new DeleteTagUseCase(this.repository)
            .execute(id)
            .then(tag => res.json({ message: "Tag deleted (or deactivated)", tag }))
            .catch(err => this.handleError(err, res));
    }
}