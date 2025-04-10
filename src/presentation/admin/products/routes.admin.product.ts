// src/presentation/admin/products/routes.admin.product.ts
import { Router, Request, Response } from "express";
import { ProductMongoDataSourceImpl } from "../../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../../infrastructure/repositories/products/product.repository.impl";
import { CategoryMongoDataSourceImpl } from "../../../infrastructure/datasources/products/category.mongo.datasource.impl"; // Dependencia del controller
import { CategoryRepositoryImpl } from "../../../infrastructure/repositories/products/category.respository.impl"; // Dependencia del controller
import { ProductController } from "../../products/controller.product"; // <<<--- REUTILIZAR Controller existente
import { UploadMiddleware } from "../../middlewares/upload.middleware"; // <<<--- REUTILIZAR Middleware para subida

export class AdminProductRoutes {
    static getRoutes(): Router {
        const router = Router();

        // --- Dependencias (Igual que en las rutas públicas) ---
        const datasourceProduct = new ProductMongoDataSourceImpl();
        const datasourceCategory = new CategoryMongoDataSourceImpl();
        const productRepository = new ProductRepositoryImpl(datasourceProduct);
        const categoryRepository = new CategoryRepositoryImpl(datasourceCategory);
        // Instanciar el MISMO controlador que usan las rutas públicas
        const controller = new ProductController(productRepository, categoryRepository);

        // --- Rutas CRUD para Admin (mapeadas a los métodos existentes del controlador) ---

        // GET /api/admin/products/ - Listar productos (puede incluir inactivos si modificas el controller/use-case)
        router.get('/', (req, res, next) => { controller.getAllProducts(req, res) });

        // GET /api/admin/products/search - Búsqueda específica para admin (si es necesaria) o reutilizar la pública
        router.get('/search', (req, res, next) => { controller.searchProducts(req, res) }); // Reutiliza la búsqueda pública

        // GET /api/admin/products/:id - Obtener detalle de producto
        router.get('/:id', (req, res, next) => { controller.getProductById(req, res) });

        // POST /api/admin/products/ - Crear producto (con middleware de subida)
        router.post('/',
            UploadMiddleware.single('image'), // Middleware para manejar el archivo 'image'
            (req, res, next) => { controller.createProduct(req, res) }
        );

        // PUT /api/admin/products/:id - Actualizar producto (con middleware de subida)
        router.put('/:id',
            UploadMiddleware.single('image'), // Middleware para manejar el archivo 'image'
            (req, res, next) => { controller.updateProduct(req, res) }
        );

        // DELETE /api/admin/products/:id - Eliminar producto
        router.delete('/:id', (req, res, next) => { controller.deleteProduct(req, res) });

        // GET /api/admin/products/by-category/:categoryId - Ver productos por categoría (útil para admin)
        router.get('/by-category/:categoryId', (req, res, next) => { controller.getProductsByCategory(req, res) });

        // Aquí podrías añadir endpoints específicos de admin si fueran necesarios,
        // como activar/desactivar productos masivamente, obtener reporte de stock bajo, etc.
        // Ejemplo: router.patch('/:id/toggle-active', controller.toggleProductActiveStatus); // Necesitaría nuevo método/caso de uso

        return router;
    }
}