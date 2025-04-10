// src/presentation/order/routes.order.ts
import { Router } from "express";
import { OrderController } from "./controller.order";
import { OrderMongoDataSourceImpl } from "../../infrastructure/datasources/order/order.mongo.datasource.impl";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order/order.repository.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware"; // <<<--- ASEGURAR IMPORTACIÓN
import { CouponMongoDataSourceImpl } from "../../infrastructure/datasources/coupon/coupon.mongo.datasource.impl";
import { CouponRepositoryImpl } from "../../infrastructure/repositories/coupon/coupon.repository.impl";

export class OrderRoutes {
    static get getOrderRoutes(): Router { // Renombrado para consistencia
        const router = Router();

        // Dependencias
        const orderDatasource = new OrderMongoDataSourceImpl();
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const productDatasource = new ProductMongoDataSourceImpl();
        const couponDatasource = new CouponMongoDataSourceImpl();

        const orderRepository = new OrderRepositoryImpl(orderDatasource);
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const productRepository = new ProductRepositoryImpl(productDatasource);
        const couponRepository = new CouponRepositoryImpl(couponDatasource);

        const controller = new OrderController(
            orderRepository,
            customerRepository,
            productRepository,
            couponRepository
        );

        // --- Rutas ---

        // Ruta POST sin AuthMiddleware explícito aquí, pero createSale puede verificar req.body.user
        router.post('/', controller.createSale);

        // <<<--- NUEVA RUTA PROTEGIDA --- >>>
        // Obtener los pedidos del usuario autenticado
        router.get('/my-orders', [AuthMiddleware.validateJwt], controller.getMyOrders);
        // <<<--- FIN NUEVA RUTA --- >>>

        // Rutas GET y PATCH podrían requerir autenticación (y rol admin?)
        // Ejemplo: router.get('/', [AuthMiddleware.validateJwt, AuthMiddleware.checkRole(['ADMIN_ROLE'])], controller.getAllSales);
        router.get('/', controller.getAllSales); // Por ahora público o requiere auth general
        router.get('/:id', controller.getSaleById); // Público o requiere auth general/admin
        router.patch('/:id/status', controller.updateSaleStatus); // Probablemente requiere auth admin

        // Rutas adicionales específicas (podrían requerir auth)
        router.get('/by-customer/:customerId', controller.getSalesByCustomer); // Requiere auth (¿o admin?)
        router.post('/by-date-range', controller.getSalesByDateRange); // Probablemente requiere auth admin

        return router;
    }
}