import { Router } from "express";
import { UnitMongoDatasourceImpl } from "../../infrastructure/datasources/products/unit.mongo.datasource.impl";
import { UnitRepositoryImpl } from "../../infrastructure/repositories/products/unit.repository.impl";
import { UnitController } from "./controller.unit";

export class UnitRoutes {
    static get getUnitRoutes(): Router {
        const router = Router();
        
        // Inicializamos las dependencias
        const datasource = new UnitMongoDatasourceImpl();
        const unitRepository = new UnitRepositoryImpl(datasource);
        const controller = new UnitController(unitRepository);

        // Definimos las rutas
        router.get('/', controller.getAllUnits);
        router.get('/:id', controller.getUnitById);
        router.post('/', controller.createUnit);
        router.put('/:id',  controller.updateUnit);
        router.delete('/:id',  controller.deleteUnit);

        return router;
    }
}