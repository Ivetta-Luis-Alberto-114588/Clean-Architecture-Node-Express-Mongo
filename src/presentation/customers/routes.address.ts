// src/presentation/customers/routes.address.ts
import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { NeighborhoodMongoDataSourceImpl } from "../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl"; // <<<--- Necesario
import { NeighborhoodRepositoryImpl } from "../../infrastructure/repositories/customers/neighborhood.repository.impl"; // <<<--- Necesario
import { AddressController } from "./controller.address";

export class AddressRoutes {
    static get getRoutes(): Router {
        const router = Router();

        // Dependencias
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const neighborhoodDatasource = new NeighborhoodMongoDataSourceImpl(); // <<<--- Instanciar
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDatasource); // <<<--- Instanciar
        const controller = new AddressController(customerRepository, neighborhoodRepository); // <<<--- Pasar repo

        // Middleware: TODAS las rutas de direcciones requieren autenticación
        // router.use(AuthMiddleware.validateJwt);

        // Rutas CRUD para las direcciones del usuario autenticado
        router.post('/', (req, res, next) => { controller.createAddress(req, res); });
        router.get('/', (req, res, next) => { controller.getMyAddresses(req, res); }); // Obtener direcciones del usuario autenticado
        // Nota: No necesitamos /:customerId en la ruta porque lo obtenemos del usuario autenticado
        router.put('/:id', (req, res, next) => { controller.updateAddress(req, res); });
        router.delete('/:id', (req, res, next) => { controller.deleteAddress(req, res); }); // Eliminar dirección
        router.patch('/:id/default', (req, res, next) => { controller.setDefaultAddress(req, res) }); // Usar PATCH para marcar como default

        return router;
    }
}