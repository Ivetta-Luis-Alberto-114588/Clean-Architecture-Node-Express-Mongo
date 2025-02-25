import { Router } from "express";
import { SaleController } from "./controller.sale";
import { SaleMongoDataSourceImpl } from "../../infrastructure/datasources/sales/sale.mongo.datasource.impl";
import { SaleRepositoryImpl } from "../../infrastructure/repositories/sales/sale.repository.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class SaleRoutes {
    static get getSaleRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const saleDatasource = new SaleMongoDataSourceImpl();
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const productDatasource = new ProductMongoDataSourceImpl();
        
        const saleRepository = new SaleRepositoryImpl(saleDatasource);
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const productRepository = new ProductRepositoryImpl(productDatasource);
        
        const controller = new SaleController(saleRepository, customerRepository, productRepository);
        
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