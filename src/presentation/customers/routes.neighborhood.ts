import { Router } from "express";
import { NeighborhoodController } from "./controller.neighborhood";
import { NeighborhoodMongoDataSourceImpl } from "../../infrastructure/datasources/customers/neighborhood.mongo.datasource.impl";
import { NeighborhoodRepositoryImpl } from "../../infrastructure/repositories/customers/neighborhood.repository.impl";
import { CityMongoDataSourceImpl } from "../../infrastructure/datasources/customers/city.mongo.datasource.impl";
import { CityRepositoryImpl } from "../../infrastructure/repositories/customers/city.repository.impl";

export class NeighborhoodRoutes {
    static get getNeighborhoodRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const neighborhoodDatasource = new NeighborhoodMongoDataSourceImpl();
        const cityDatasource = new CityMongoDataSourceImpl();
        const neighborhoodRepository = new NeighborhoodRepositoryImpl(neighborhoodDatasource);
        const cityRepository = new CityRepositoryImpl(cityDatasource);
        const controller = new NeighborhoodController(neighborhoodRepository, cityRepository);
        
        // Definimos las rutas
        router.get('/', controller.getAllNeighborhoods);
        router.get('/:id', controller.getNeighborhoodById);
        router.post('/', controller.createNeighborhood);
        router.put('/:id', controller.updateNeighborhood);
        router.delete('/:id', controller.deleteNeighborhood);
        
        // Rutas adicionales específicas
        router.get('/by-city/:cityId', controller.getNeighborhoodsByCity);
        
        return router;
    }
}