// src/presentation/admin/products/routes.admin.product.ts
import { Router, Request, Response } from "express";
import { ProductMongoDataSourceImpl } from "../../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../../infrastructure/repositories/products/product.repository.impl";
import { CategoryMongoDataSourceImpl } from "../../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../../infrastructure/repositories/products/category.respository.impl";
import { ProductController } from "../../products/controller.product";
import { UploadMiddleware } from "../../middlewares/upload.middleware"; // Importar el middleware modificado

export class AdminProductRoutes {
    static getRoutes(): Router {
        const router = Router();

        const datasourceProduct = new ProductMongoDataSourceImpl();
        const datasourceCategory = new CategoryMongoDataSourceImpl();
        const productRepository = new ProductRepositoryImpl(datasourceProduct);
        const categoryRepository = new CategoryRepositoryImpl(datasourceCategory);
        const controller = new ProductController(productRepository, categoryRepository); router.get('/', (req, res, next) => { controller.getAllProducts(req, res) });
        router.get('/search', (req, res, next) => { controller.searchProducts(req, res) });
        router.get('/by-category/:categoryId', (req, res, next) => { controller.getProductsByCategory(req, res) });
        router.get('/:id', (req, res, next) => { controller.getProductById(req, res) });        // --- USAR singleOptional para POST ---
        router.post('/',
            UploadMiddleware.singleOptional('image'), // Imagen opcional al crear
            (req, res, next) => { controller.createProduct(req, res) }
        );

        // --- USAR singleOptional para PUT ---
        router.put('/:id',
            UploadMiddleware.singleOptional('image'), // Ahora la imagen es opcional al actualizar
            (req, res, next) => { controller.updateProduct(req, res) }
        );
        // --- FIN CAMBIO ---

        router.delete('/:id', (req, res, next) => { controller.deleteProduct(req, res) });

        return router;
    }
}