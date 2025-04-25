// src/presentation/admin/products/routes.admin.product.ts
import { Router, Request, Response } from "express";
import { ProductMongoDataSourceImpl } from "../../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../../infrastructure/repositories/products/product.repository.impl";
import { CategoryMongoDataSourceImpl } from "../../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../../infrastructure/repositories/products/category.respository.impl";
import { ProductController } from "../../products/controller.product";
import { UploadMiddleware } from "../../middlewares/upload.middleware";

export class AdminProductRoutes {
    static getRoutes(): Router {
        const router = Router();

        const datasourceProduct = new ProductMongoDataSourceImpl();
        const datasourceCategory = new CategoryMongoDataSourceImpl();
        const productRepository = new ProductRepositoryImpl(datasourceProduct);
        const categoryRepository = new CategoryRepositoryImpl(datasourceCategory);
        const controller = new ProductController(productRepository, categoryRepository);

        // GET /api/admin/products/ - Listar productos (AHORA DEVUELVE { total, products })
        router.get('/', (req, res, next) => { controller.getAllProducts(req, res) });

        // GET /api/admin/products/search - Búsqueda específica para admin
        router.get('/search', (req, res, next) => { controller.searchProducts(req, res) });

        // GET /api/admin/products/:id - Obtener detalle de producto
        router.get('/:id', (req, res, next) => { controller.getProductById(req, res) });

        // POST /api/admin/products/ - Crear producto (con middleware de subida)
        router.post('/',
            UploadMiddleware.single('image'),
            (req, res, next) => { controller.createProduct(req, res) }
        );

        // PUT /api/admin/products/:id - Actualizar producto (con middleware de subida)
        router.put('/:id',
            UploadMiddleware.single('image'),
            (req, res, next) => { controller.updateProduct(req, res) }
        );

        // DELETE /api/admin/products/:id - Eliminar producto
        router.delete('/:id', (req, res, next) => { controller.deleteProduct(req, res) });

        // GET /api/admin/products/by-category/:categoryId - Ver productos por categoría
        router.get('/by-category/:categoryId', (req, res, next) => { controller.getProductsByCategory(req, res) });

        return router;
    }
}