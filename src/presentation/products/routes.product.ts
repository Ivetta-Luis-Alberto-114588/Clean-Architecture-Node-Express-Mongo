// src/presentation/products/routes.product.ts
import { Router } from "express";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { ProductController } from "./controller.product";
import { CategoryMongoDataSourceImpl } from "../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../infrastructure/repositories/products/category.respository.impl";
import { Request, Response } from "express";

export class ProductRoutes {
    static get getProductRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const datasourceProduct = new ProductMongoDataSourceImpl();
        const datasourceCategory = new CategoryMongoDataSourceImpl();

        const productRepository = new ProductRepositoryImpl(datasourceProduct);
        const categoryRepository = new CategoryRepositoryImpl(datasourceCategory);

        const controller = new ProductController(productRepository, categoryRepository);

        // Mover la ruta específica primero (antes de las rutas con comodines)
        router.get('/by-category/:categoryId', (req: Request, res: Response) => {
            controller.getProductsByCategory(req, res);
        });

        // Rutas básicas
        router.get('/', (req: Request, res: Response) => {
            controller.getAllProducts(req, res);
        });
        
        router.get('/:id', (req: Request, res: Response) => {
            controller.getAllProducts(req, res);
        });
        
        router.post('/', (req: Request, res: Response) => {
            controller.createProduct(req, res);
        });
        
        router.put('/:id', (req: Request, res: Response) => {
            controller.updateProduct(req, res);
        });
        
        router.delete('/:id', (req: Request, res: Response) => {
            controller.deleteProduct(req, res);
        });
        
        return router;
    }
}