// src/presentation/admin/customers/routes.admin.city.ts
import { Router } from "express";
import { CityController } from "../../customers/controller.city"; // Reutilizar
import { CityMongoDataSourceImpl } from "../../../infrastructure/datasources/customers/city.mongo.datasource.impl";
import { CityRepositoryImpl } from "../../../infrastructure/repositories/customers/city.repository.impl";

export class AdminCityRoutes {
    static getRoutes(): Router {
        const router = Router();

        // Dependencias
        const datasource = new CityMongoDataSourceImpl();
        const repository = new CityRepositoryImpl(datasource);
        const controller = new CityController(repository);

        // Rutas CRUD Admin
        router.get('/', controller.getAllCities);
        router.get('/:id', controller.getCityById);
        router.post('/', controller.createCity);
        router.put('/:id', controller.updateCity);
        router.delete('/:id', controller.deleteCity);
        router.get('/by-name/:name', controller.findCityByName); // Útil para admin

        return router;
    }
}