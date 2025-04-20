// src/presentation/admin/tags/routes.admin.tag.ts
import { Router } from "express";
import { TagMongoDataSourceImpl } from "../../../infrastructure/datasources/products/tag.mongo.datasource.impl";
import { TagRepositoryImpl } from "../../../infrastructure/repositories/products/tag.repository.impl";
import { TagController } from "../../products/controller.tag"; // Reutilizar el controller

export class AdminTagRoutes {
    static getRoutes(): Router {
        const router = Router();
        const datasource = new TagMongoDataSourceImpl();
        const repository = new TagRepositoryImpl(datasource);
        const controller = new TagController(repository);

        // Ya está protegido por el middleware en AdminRoutes
        router.get('/', controller.getAllTags.bind(controller));
        router.get('/:id', controller.getTagById.bind(controller));
        router.post('/', controller.createTag.bind(controller));
        router.put('/:id', controller.updateTag.bind(controller));
        router.delete('/:id', controller.deleteTag.bind(controller)); // O podría ser un PATCH para desactivar

        return router;
    }
}