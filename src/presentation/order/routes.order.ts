// src/presentation/order/routes.order.ts
import { Router } from "express";
import { OrderController } from "./controller.order";
import { OrderMongoDataSourceImpl } from "../../infrastructure/datasources/order/order.mongo.datasource.impl";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order/order.repository.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { CouponMongoDataSourceImpl } from "../../infrastructure/datasources/coupon/coupon.mongo.datasource.impl";
import { CouponRepositoryImpl } from "../../infrastructure/repositories/coupon/coupon.repository.impl";
// <<<--- IMPORTAR REPOS FALTANTES --- >>>
import { NeighborhoodMongoDataSourceImpl } from "../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl";
import { NeighborhoodRepositoryImpl } from "../../infrastructure/repositories/customers/neighborhood.repository.impl";
import { CityMongoDataSourceImpl } from "../../infrastructure/datasources/customers/city.mongo.datasource.impl";
import { CityRepositoryImpl } from "../../infrastructure/repositories/customers/city.repository.impl";

export class OrderRoutes {
    static get getOrderRoutes(): Router {
        const router = Router();

        // Dependencias
        const orderDatasource = new OrderMongoDataSourceImpl();
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const productDatasource = new ProductMongoDataSourceImpl();
        const couponDatasource = new CouponMongoDataSourceImpl();
        const neighborhoodDatasource = new NeighborhoodMongoDataSourceImpl(); // <<<--- NUEVO
        const cityDatasource = new CityMongoDataSourceImpl();             // <<<--- NUEVO

        const orderRepository = new OrderRepositoryImpl(orderDatasource);
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const productRepository = new ProductRepositoryImpl(productDatasource);
        const couponRepository = new CouponRepositoryImpl(couponDatasource);
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDatasource); // <<<--- NUEVO
        const cityRepository = new CityRepositoryImpl(cityDatasource);                         // <<<--- NUEVO

        // <<<--- PASAR NUEVAS DEPENDENCIAS AL CONTROLLER --- >>>
        const controller = new OrderController(
            orderRepository,
            customerRepository,
            productRepository,
            couponRepository,
            neighborhoodRepository, // Pasar
            cityRepository          // Pasar
        );

        // --- Rutas (sin cambios aquí) ---
        router.post('/', controller.createSale);
        router.get('/my-orders', [AuthMiddleware.validateJwt], controller.getMyOrders);
        router.get('/', controller.getAllSales);
        router.get('/:id', controller.getSaleById);
        router.patch('/:id/status', controller.updateSaleStatus);
        router.get('/by-customer/:customerId', controller.getSalesByCustomer);
        router.post('/by-date-range', controller.getSalesByDateRange);

        return router;
    }
}