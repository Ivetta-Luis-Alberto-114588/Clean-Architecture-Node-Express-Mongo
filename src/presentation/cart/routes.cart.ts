import { Router } from "express";
import { CartController } from "./controller.cart";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { CartMongoDataSourceImpl } from "../../infrastructure/datasources/cart/cart.mongo.datasource.impl";
import { CartRepositoryImpl } from "../../infrastructure/repositories/cart/cart.repository.impl";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";

export class CartRoutes {

    static get getCartRoutes(): Router {
        const router = Router();

        // --- Dependencias ---
        const cartDatasource = new CartMongoDataSourceImpl();
        const productDatasource = new ProductMongoDataSourceImpl(); // Necesario para validaciones

        const cartRepository = new CartRepositoryImpl(cartDatasource);
        const productRepository = new ProductRepositoryImpl(productDatasource);

        const controller = new CartController(cartRepository, productRepository);

        // --- Middleware ---
        // Aplicar autenticación a todas las rutas del carrito
        router.use(AuthMiddleware.validateJwt);

        // --- Rutas ---
        router.get('/', (req, res, next) => { controller.getCart(req, res) });
        router.post('/items', (req, res, next) => { controller.addItem(req, res) });
        router.put('/items/:productId', (req, res, next) => { controller.updateItem(req, res) });
        router.delete('/items/:productId', (req, res, next) => { controller.removeItem(req, res) });
        router.delete('/', (req, res, next) => { controller.clearCart(req, res) });            // Vaciar todo el carrito

        return router;
    }
}