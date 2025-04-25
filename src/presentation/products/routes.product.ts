// src/presentation/products/routes.product.ts
import { Router, Request, Response } from "express";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { ProductController } from "./controller.product";
import { CategoryMongoDataSourceImpl } from "../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../infrastructure/repositories/products/category.respository.impl";
// Eliminar la importación de UploadMiddleware si no se usa en ninguna otra ruta pública aquí
// import { UploadMiddleware } from "../middlewares/upload.middleware";

export class ProductRoutes {
    static get getProductRoutes(): Router {
        const router = Router();

        // Dependencias (se mantienen)
        const datasourceProduct = new ProductMongoDataSourceImpl();
        const datasourceCategory = new CategoryMongoDataSourceImpl();
        const productRepository = new ProductRepositoryImpl(datasourceProduct);
        const categoryRepository = new CategoryRepositoryImpl(datasourceCategory);
        const controller = new ProductController(productRepository, categoryRepository);

        // --- Rutas Públicas (Solo Lectura) ---

        // GET /api/products/search?q=... (Búsqueda)
        router.get('/search', (req: Request, res: Response) => {
            controller.searchProducts(req, res);
        });

        // GET /api/products/by-category/:categoryId (Productos por categoría)
        router.get('/by-category/:categoryId', (req: Request, res: Response) => {
            controller.getProductsByCategory(req, res);
        });

        // GET /api/products/ (Listar todos los productos activos paginados)
        router.get('/', (req: Request, res: Response) => {
            // Asegúrate que el controller.getAllProducts usa el datasource.getAll
            // que ahora devuelve { total, products } y filtra por isActive:true
            controller.getAllProducts(req, res);
        });

        // GET /api/products/:id (Detalle de producto)
        router.get('/:id', (req: Request, res: Response) => {
            controller.getProductById(req, res);
        });

        // --- ELIMINAR RUTAS POST, PUT, DELETE PÚBLICAS ---
        // Estas operaciones deben ir en las rutas de admin
        /*
        router.post('/',
            UploadMiddleware.single('image'), // <-- ELIMINAR ESTO
            (req: Request, res: Response) => { controller.createProduct(req, res); }
        );
        router.put('/:id',
            UploadMiddleware.single('image'), // <-- ELIMINAR ESTO
            (req: Request, res: Response) => { controller.updateProduct(req, res); }
        );
        router.delete('/:id', (req: Request, res: Response) => { // <-- ELIMINAR ESTO (o protegerlo si es necesario)
            controller.deleteProduct(req, res);
        });
        */
        // --- FIN ELIMINACIÓN ---

        return router;
    }
}