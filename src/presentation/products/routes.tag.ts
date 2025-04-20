// src/presentation/products/routes.tag.ts
import { Request, Response, Router } from "express";
import { TagMongoDataSourceImpl } from "../../infrastructure/datasources/products/tag.mongo.datasource.impl";
import { TagRepositoryImpl } from "../../infrastructure/repositories/products/tag.repository.impl";
import { TagController } from "./controller.tag"; // Asegúrate que este archivo exista
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class TagRoutes {
    static get getRoutes(): Router {
        const router = Router();
        const datasource = new TagMongoDataSourceImpl();
        const repository = new TagRepositoryImpl(datasource);
        const controller = new TagController(repository);

        // Rutas públicas (si las necesitas, ej: GET /)
        router.get('/', (req: Request, res: Response) => { controller.getAllTags(req, res) }); // Lista todas las tags (útil para filtros)
        // router.get('/:id', controller.getTagById); // Quizás no sea pública

        // Rutas protegidas para admin (se definen aparte en routes.admin.ts)

        return router;
    }
}

