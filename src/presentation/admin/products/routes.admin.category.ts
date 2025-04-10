// src/presentation/admin/products/routes.admin.category.ts
import { Router } from "express";
import { CategoryMongoDataSourceImpl } from "../../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../../infrastructure/repositories/products/category.respository.impl";
import { CategoryController } from "../../products/controller.category";

export class AdminCategoryRoutes {
    static getRoutes(): Router {
        const router = Router();
        const datasource = new CategoryMongoDataSourceImpl();
        const repository = new CategoryRepositoryImpl(datasource);
        const controller = new CategoryController(repository);

        router.get('/', controller.getAllCategories);
        router.get('/:id', controller.getCategoryById);
        router.post('/', controller.createCategory);
        router.put('/:id', controller.updateCategory);
        router.delete('/:id', controller.deleteCategory);

        return router;
    }
}