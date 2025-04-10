// src/presentation/products/routes.product.ts
import { Router, Request, Response } from "express";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { ProductController } from "./controller.product";
import { CategoryMongoDataSourceImpl } from "../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../infrastructure/repositories/products/category.respository.impl";
import { UploadMiddleware } from "../middlewares/upload.middleware";

export class ProductRoutes {
    static get getProductRoutes(): Router {
        const router = Router();

        // Dependencias
        const datasourceProduct = new ProductMongoDataSourceImpl();
        const datasourceCategory = new CategoryMongoDataSourceImpl();
        const productRepository = new ProductRepositoryImpl(datasourceProduct);
        const categoryRepository = new CategoryRepositoryImpl(datasourceCategory);
        const controller = new ProductController(productRepository, categoryRepository);

        // <<<--- NUEVA RUTA DE BÚSQUEDA --- >>>
        // GET /api/products/search?q=keyword&categories=id1,id2&minPrice=10&maxPrice=100&sortBy=price&sortOrder=asc&page=1&limit=20
        router.get('/search', (req: Request, res: Response) => {
            controller.searchProducts(req, res);
        });
        // <<<--- FIN NUEVA RUTA --- >>>

        // Rutas existentes
        router.get('/by-category/:categoryId', (req: Request, res: Response) => {
            controller.getProductsByCategory(req, res);
        });
        router.get('/', (req: Request, res: Response) => {
            controller.getAllProducts(req, res); // Asegúrate que esta ruta no capture '/search'
        });
        router.get('/:id', (req: Request, res: Response) => {
            controller.getProductById(req, res);
        });
        router.post('/',
            UploadMiddleware.single('image'),
            (req: Request, res: Response) => { controller.createProduct(req, res); }
        );
        router.put('/:id',
            UploadMiddleware.single('image'),
            (req: Request, res: Response) => { controller.updateProduct(req, res); }
        );
        router.delete('/:id', (req: Request, res: Response) => {
            controller.deleteProduct(req, res);
        });

        return router;
    }
}