import { Router } from "express";
import { CityController } from "./controller.city";
import { CityMongoDataSourceImpl } from "../../infrastructure/datasources/customers/city.mongo.datasource.impl";
import { CityRepositoryImpl } from "../../infrastructure/repositories/customers/city.repository.impl";

export class CityRoutes {
    static get getCityRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const datasource = new CityMongoDataSourceImpl();
        const cityRepository = new CityRepositoryImpl(datasource);
        const controller = new CityController(cityRepository);
        
        // Definimos las rutas
        router.get('/', controller.getAllCities);
        router.get('/:id', controller.getCityById);
        router.post('/', controller.createCity);
        router.put('/:id', controller.updateCity);
        router.delete('/:id', controller.deleteCity);
        
        // Rutas adicionales
        router.get('/by-name/:name', controller.findCityByName);
        
        return router;
    }
}