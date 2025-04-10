// src/presentation/admin/products/routes.admin.unit.ts
import { Router } from "express";
import { UnitMongoDatasourceImpl } from "../../../infrastructure/datasources/products/unit.mongo.datasource.impl";
import { UnitRepositoryImpl } from "../../../infrastructure/repositories/products/unit.repository.impl";
import { UnitController } from "../../products/controller.unit"; // Reutilizar Controller

export class AdminUnitRoutes {
    static getRoutes(): Router {
        const router = Router();

        // Dependencias
        const datasource = new UnitMongoDatasourceImpl();
        const repository = new UnitRepositoryImpl(datasource);
        const controller = new UnitController(repository); // Usar el mismo controller

        // Rutas CRUD Admin
        router.get('/', controller.getAllUnits);
        router.get('/:id', controller.getUnitById);
        router.post('/', controller.createUnit);
        router.put('/:id', controller.updateUnit);
        router.delete('/:id', controller.deleteUnit);

        return router;
    }
}