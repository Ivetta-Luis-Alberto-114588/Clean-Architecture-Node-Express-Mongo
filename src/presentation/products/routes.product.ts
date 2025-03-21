// Corrección para src/presentation/products/routes.product.ts

import { Router } from "express";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { ProductController } from "./controller.product";
import { CategoryMongoDataSourceImpl } from "../../infrastructure/datasources/products/category.mongo.datasource.impl";
import { CategoryRepositoryImpl } from "../../infrastructure/repositories/products/category.respository.impl";
import { Request, Response } from "express";
import { UploadMiddleware } from "../middlewares/upload.middleware";

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

        // La ruta original para obtener por ID tenía un error, realmente estaba llamando a getAllProducts
        // Corregimos para que use el método correcto
        router.get('/:id', (req: Request, res: Response) => {
            // Esta línea debería llamar a un método específico para obtener por ID
            // Pero como no vemos ese método en el controlador, podemos usar findById directamente
            controller.getProductById(req, res);
        });

        // Rutas con soporte para subida de imágenes
        router.post('/',
            UploadMiddleware.single('image'), // 'image' es el nombre del campo del formulario
            (req: Request, res: Response) => {
                controller.createProduct(req, res);
            }
        );

        router.put('/:id',
            UploadMiddleware.single('image'),
            (req: Request, res: Response) => {
                controller.updateProduct(req, res);
            }
        );


        // El problema principal podría estar aquí - asegurémonos de que pasa correctamente el control
        router.delete('/:id', (req: Request, res: Response) => {
            controller.deleteProduct(req, res);
        });

        return router;
    }
}