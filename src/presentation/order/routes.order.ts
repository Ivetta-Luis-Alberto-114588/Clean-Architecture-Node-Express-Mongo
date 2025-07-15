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
import { NeighborhoodMongoDataSourceImpl } from "../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl";
import { NeighborhoodRepositoryImpl } from "../../infrastructure/repositories/customers/neighborhood.repository.impl";
import { CityMongoDataSourceImpl } from "../../infrastructure/datasources/customers/city.mongo.datasource.impl";
import { CityRepositoryImpl } from "../../infrastructure/repositories/customers/city.repository.impl";
import { OrderStatusMongoDataSourceImpl } from "../../infrastructure/datasources/order/order-status.mongo.datasource.impl";
import { OrderStatusRepositoryImpl } from "../../infrastructure/repositories/order/order-status.repository.impl";
import { PaymentMethodMongoDataSourceImpl } from "../../infrastructure/datasources/payment/payment-method.mongo.datasource.impl";
import { PaymentMethodRepositoryImpl } from "../../infrastructure/repositories/payment/payment-method.repository.impl";
import { DeliveryMethodMongoDatasourceImpl } from "../../infrastructure/datasources/delivery-methods/delivery-method.mongo.datasource.impl";
import { DeliveryMethodRepositoryImpl } from "../../infrastructure/repositories/delivery-methods/delivery-method.repository.impl";
import { UpdateOrderUseCase } from "../../domain/use-cases/order/update-order.use-case";
import { loggerService } from "../../configs/logger";
import { notificationService } from "../../configs/notification";

export class OrderRoutes {
    static get getOrderRoutes(): Router {
        const router = Router();

        // Dependencias
        const orderDatasource = new OrderMongoDataSourceImpl();
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const productDatasource = new ProductMongoDataSourceImpl();
        const couponDatasource = new CouponMongoDataSourceImpl();
        const neighborhoodDatasource = new NeighborhoodMongoDataSourceImpl();
        const cityDatasource = new CityMongoDataSourceImpl(); const orderStatusDatasource = new OrderStatusMongoDataSourceImpl();
        const paymentMethodDatasource = new PaymentMethodMongoDataSourceImpl();
        const deliveryMethodDatasource = new DeliveryMethodMongoDatasourceImpl();

        // Repositorios
        const orderRepository = new OrderRepositoryImpl(orderDatasource);
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const productRepository = new ProductRepositoryImpl(productDatasource);
        const couponRepository = new CouponRepositoryImpl(couponDatasource);
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDatasource);
        const cityRepository = new CityRepositoryImpl(cityDatasource);
        const orderStatusRepository = new OrderStatusRepositoryImpl(orderStatusDatasource);
        const paymentMethodRepository = new PaymentMethodRepositoryImpl(paymentMethodDatasource);
        const deliveryMethodRepository = new DeliveryMethodRepositoryImpl(deliveryMethodDatasource);

        // Use cases
        const updateOrderUseCase = new UpdateOrderUseCase(orderRepository);        // Controller con todas las dependencias
        const controller = new OrderController(
            orderRepository,
            customerRepository,
            productRepository,
            couponRepository,
            neighborhoodRepository,
            cityRepository,
            orderStatusRepository,
            deliveryMethodRepository,
            paymentMethodRepository,
            loggerService,
            updateOrderUseCase
        );        // Rutas
        router.post('/', [AuthMiddleware.validateJwtOptional], controller.createSale);
        router.get('/my-orders', [AuthMiddleware.validateJwt], controller.getMyOrders);
        router.get('/', controller.getAllSales);
        router.get('/:id', controller.getSaleById);
        router.patch('/:id/status', controller.updateSaleStatus);
        router.get('/by-customer/:customerId', controller.getSalesByCustomer);
        router.post('/by-date-range', controller.getSalesByDateRange);
        // NUEVO: endpoint para actualizar completamente un pedido
        router.put('/:id', [AuthMiddleware.validateJwt], controller.updateSale);
        // NUEVO: endpoint para seleccionar método de pago
        router.patch('/:orderId/payment-method', [AuthMiddleware.validateJwt], controller.selectPaymentMethod);

        return router;
    }
}