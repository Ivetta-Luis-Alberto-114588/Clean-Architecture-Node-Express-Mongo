// src/presentation/admin/tags/routes.admin.tag.ts
import { Router, Request, Response } from "express"; // Asegurar imports de Express
import { TagMongoDataSourceImpl } from "../../../infrastructure/datasources/products/tag.mongo.datasource.impl";
import { TagRepositoryImpl } from "../../../infrastructure/repositories/products/tag.repository.impl";
import { TagController } from "../../products/controller.tag";

export class AdminTagRoutes {
    static getRoutes(): Router {
        const router = Router();
        const datasource = new TagMongoDataSourceImpl();
        const repository = new TagRepositoryImpl(datasource);
        const controller = new TagController(repository);

        // Ya está protegido por el middleware en AdminRoutes

        // <<<--- AÑADIDO .bind(controller) a todos los manejadores --- >>>
        router.get('/', controller.getAllTags.bind(controller));
        router.get('/:id', controller.getTagById.bind(controller));
        router.post('/', controller.createTag.bind(controller));
        router.put('/:id', controller.updateTag.bind(controller));
        router.delete('/:id', controller.deleteTag.bind(controller));

        return router;
    }
}