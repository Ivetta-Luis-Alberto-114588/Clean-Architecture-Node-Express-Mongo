// src/presentation/admin/customers/routes.admin.neighborhood.ts
import { Router } from "express";
import { NeighborhoodController } from "../../customers/controller.neighborhood"; // Reutilizar
import { NeighborhoodMongoDataSourceImpl } from "../../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl";
import { NeighborhoodRepositoryImpl } from "../../../infrastructure/repositories/customers/neighborhood.repository.impl";
import { CityMongoDataSourceImpl } from "../../../infrastructure/datasources/customers/city.mongo.datasource.impl"; // Dependencia
import { CityRepositoryImpl } from "../../../infrastructure/repositories/customers/city.repository.impl"; // Dependencia

export class AdminNeighborhoodRoutes {
    static getRoutes(): Router {
        const router = Router();

        // Dependencias
        const neighborhoodDatasource = new NeighborhoodMongoDataSourceImpl();
        const cityDatasource = new CityMongoDataSourceImpl();
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDatasource);
        const cityRepository = new CityRepositoryImpl(cityDatasource);
        const controller = new NeighborhoodController(neighborhoodRepository, cityRepository);

        // Rutas CRUD Admin
        router.get('/', controller.getAllNeighborhoods);
        router.get('/:id', controller.getNeighborhoodById);
        router.post('/', controller.createNeighborhood);
        router.put('/:id', controller.updateNeighborhood);
        router.delete('/:id', controller.deleteNeighborhood);
        router.get('/by-city/:cityId', controller.getNeighborhoodsByCity); // Útil para admin

        return router;
    }
}