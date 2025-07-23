// src/presentation/admin/customers/routes.admin.customer.ts
import { Router } from "express";
import { CustomerController } from "../../customers/controller.customer"; // Reutilizar
import { CustomerMongoDataSourceImpl } from "../../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../../infrastructure/repositories/customers/customer.repository.impl";
import { NeighborhoodMongoDataSourceImpl } from "../../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl"; // Dependencia del controller
import { NeighborhoodRepositoryImpl } from "../../../infrastructure/repositories/customers/neighborhood.repository.impl"; // Dependencia del controller

export class AdminCustomerRoutes {
    static getRoutes(): Router {
        const router = Router();

        // Dependencias
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const neighborhoodDatasource = new NeighborhoodMongoDataSourceImpl();
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDatasource);
        const controller = new CustomerController(customerRepository, neighborhoodRepository);

        // Rutas CRUD Admin
        router.get('/search', controller.searchCustomers); // Nuevo endpoint de búsqueda
        router.get('/', controller.getAllCustomers);
        router.get('/:id', controller.getCustomerById);
        router.post('/', controller.createCustomer); // Permite al admin crear clientes directamente
        router.put('/:id', controller.updateCustomer);
        router.delete('/:id', controller.deleteCustomer);
        router.get('/by-neighborhood/:neighborhoodId', controller.getCustomersByNeighborhood);
        router.get('/by-email/:email', controller.getCustomerByEmail); // Útil para admin

        return router;
    }
}