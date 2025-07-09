import { Router } from "express";
import { SalesController } from "./controller";
import { SaleRepositoryImpl } from "../../infrastructure/repositories/sales/sale.repository.impl";
import { SaleMongoDataSourceImpl } from "../../infrastructure/datasources/sales/sale.mongo.datasource.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { ProductMongoDataSourceImpl } from "../../infrastructure/datasources/products/product.mongo.datasource.impl";
import { ProductRepositoryImpl } from "../../infrastructure/repositories/products/product.repository.impl";
import { NeighborhoodMongoDataSourceImpl } from "../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl";
import { NeighborhoodRepositoryImpl } from "../../infrastructure/repositories/customers/neighborhood.repository.impl";
import { CreateSaleUseCaseImpl } from "../../domain/use-cases/sales/create-sale.use-case";
import { GetSaleByIdUseCaseImpl } from "../../domain/use-cases/sales/get-sale-by-id.use-case";
import { UpdateSaleStatusUseCaseImpl } from "../../domain/use-cases/sales/update-sale-status.use-case";
import { GetAllSalesUseCaseImpl } from "../../domain/use-cases/sales/get-all-sales.use-case";
import { GetSalesByCustomerUseCaseImpl } from "../../domain/use-cases/sales/get-sales-by-customer.use-case";
import { GetSalesByStatusUseCaseImpl } from "../../domain/use-cases/sales/get-sales-by-status.use-case";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class SalesRoutes {

    static get routes(): Router {
        const router = Router();        // Dependencies
        const saleDataSource = new SaleMongoDataSourceImpl();
        const saleRepository = new SaleRepositoryImpl(saleDataSource);

        // Customer dependencies
        const customerDataSource = new CustomerMongoDataSourceImpl();
        const customerRepository = new CustomerRepositoryImpl(customerDataSource);

        // Product dependencies
        const productDataSource = new ProductMongoDataSourceImpl();
        const productRepository = new ProductRepositoryImpl(productDataSource);

        // Neighborhood dependencies
        const neighborhoodDataSource = new NeighborhoodMongoDataSourceImpl();
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDataSource);

        // Use cases
        const createSaleUseCase = new CreateSaleUseCaseImpl(saleRepository, customerRepository, productRepository, neighborhoodRepository);
        const getSaleByIdUseCase = new GetSaleByIdUseCaseImpl(saleRepository);
        const updateSaleStatusUseCase = new UpdateSaleStatusUseCaseImpl(saleRepository);
        const getAllSalesUseCase = new GetAllSalesUseCaseImpl(saleRepository);
        const getSalesByCustomerUseCase = new GetSalesByCustomerUseCaseImpl(saleRepository);
        const getSalesByStatusUseCase = new GetSalesByStatusUseCaseImpl(saleRepository);

        // Controller
        const salesController = new SalesController(
            createSaleUseCase,
            getSaleByIdUseCase,
            updateSaleStatusUseCase,
            getAllSalesUseCase,
            getSalesByCustomerUseCase,
            getSalesByStatusUseCase
        );

        // Routes
        router.post('/', AuthMiddleware.validateJwt, salesController.createSale.bind(salesController));
        router.get('/', salesController.getAllSales.bind(salesController));
        router.get('/:id', salesController.getSaleById.bind(salesController));
        router.patch('/:id/status', salesController.updateSaleStatus.bind(salesController));
        router.get('/customer/:customerId', salesController.getSalesByCustomer.bind(salesController));
        router.get('/status/:status', salesController.getSalesByStatus.bind(salesController));

        return router;
    }
}