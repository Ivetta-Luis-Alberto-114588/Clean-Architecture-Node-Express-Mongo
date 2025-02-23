import { Router } from "express";
import { CategoryMongoDataSourceImpl } from "../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../infrastructure/repositories/products/category.respository.impl";
import { CategoryController } from "./controller.category";


export class CategoryRoutes {
    static get getCategoryRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const datasource = new CategoryMongoDataSourceImpl();
        const categoryRepository = new CategoryRepositoryImpl(datasource);
        const controller = new CategoryController(categoryRepository);

        // Definimos las rutas correctamente
        router.get('/', controller.getAllCategories); //ok
        router.get('/:id', controller.getCategoryById); //ok   
        router.post('/', controller.createCategory); //ok
        router.put('/:id', controller.updateCategory);   //ok
        router.delete('/:id', controller.deleteCategory); //ok

        return router;
    }
}