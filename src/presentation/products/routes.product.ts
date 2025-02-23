import { Router } from "express";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { ProductController } from "./controller.product";
import { CategoryMongoDataSourceImpl } from "../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../infrastructure/repositories/products/category.respository.impl";

export class ProductRoutes {
    static get getProductRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const datasourceProduct = new ProductMongoDataSourceImpl();
        const datasourceCategory = new CategoryMongoDataSourceImpl();

        const productRepository = new ProductRepositoryImpl(datasourceProduct);
        const categoryRepository = new CategoryRepositoryImpl(datasourceCategory);


        const controller = new ProductController(productRepository, categoryRepository);

        // Definimos las rutas
        router.get('/', controller.getAllProducts);
        router.get('/:id', controller.getAllProducts);
        router.post('/',  controller.createProduct);
        router.put('/:id',  controller.updateProduct);
        router.delete('/:id',controller.deleteProduct);
        
        // Rutas adicionales específicas de productos
        router.get('/by-category/:categoryId', controller.getProductsByCategory);
     

        return router;
    }
}