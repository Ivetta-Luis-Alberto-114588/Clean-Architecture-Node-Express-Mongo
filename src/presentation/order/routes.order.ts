import { Router } from "express";
import { OrderController } from "./controller.order";
import { OrderMongoDataSourceImpl } from "../../infrastructure/datasources/order/order.mongo.datasource.impl";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order/order.repository.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class OrderRoutes {
    static get getSaleRoutes(): Router {
        const router = Router();

        // Inicializamos las dependencias
        const saleDatasource = new OrderMongoDataSourceImpl();
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const productDatasource = new ProductMongoDataSourceImpl();

        const saleRepository = new OrderRepositoryImpl(saleDatasource);
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const productRepository = new ProductRepositoryImpl(productDatasource);

        const controller = new OrderController(saleRepository, customerRepository, productRepository);

        // Definimos las rutas
        // Podemos usar el middleware de autenticación para proteger estas rutas
        // ya que generalmente las ventas solo pueden ser gestionadas por usuarios autenticados

        // Rutas básicas CRUD
        router.get('/', controller.getAllSales);
        router.get('/:id', controller.getSaleById);
        router.post('/', controller.createSale);
        router.patch('/:id/status', controller.updateSaleStatus);

        // Rutas adicionales específicas
        router.get('/by-customer/:customerId', controller.getSalesByCustomer);
        router.post('/by-date-range', controller.getSalesByDateRange);

        return router;
    }
}