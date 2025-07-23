import { Router } from "express";
import { CustomerController } from "./controller.customer";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { NeighborhoodMongoDataSourceImpl } from "../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl";
import { NeighborhoodRepositoryImpl } from "../../infrastructure/repositories/customers/neighborhood.repository.impl";

export class CustomerRoutes {
    static get getCustomerRoutes(): Router {
        const router = Router();

        // Inicializamos las dependencias
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const neighborhoodDatasource = new NeighborhoodMongoDataSourceImpl();
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDatasource);
        const controller = new CustomerController(customerRepository, neighborhoodRepository);

        // Definimos las rutas
        router.get('/search', controller.searchCustomers); // Nuevo endpoint de búsqueda
        router.get('/', controller.getAllCustomers);
        router.get('/:id', controller.getCustomerById);
        router.post('/', controller.createCustomer);
        router.put('/:id', controller.updateCustomer);
        router.delete('/:id', controller.deleteCustomer);

        // Rutas adicionales específicas
        router.get('/by-neighborhood/:neighborhoodId', controller.getCustomersByNeighborhood);
        router.get('/by-email/:email', controller.getCustomerByEmail);

        return router;
    }
}