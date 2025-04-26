// src/presentation/admin/users/routes.admin.user.ts
import { Router } from "express";
import { AuthController } from "../../auth/controller.auth"; // Usar AuthController existente
import { AuthRepositoryImpl } from "../../../infrastructure/repositories/auth.repository.impl";
import { AuthDatasourceImpl } from "../../../infrastructure/datasources/auth.mongo.datasource.impl";
import { CustomerRepositoryImpl } from "../../../infrastructure/repositories/customers/customer.repository.impl"; // Necesario para el constructor
import { CustomerMongoDataSourceImpl } from "../../../infrastructure/datasources/customers/customer.mongo.datasource.impl"; // Necesario
import { NodemailerAdapter } from "../../../infrastructure/adapters/nodemailer.adapter"; // Necesario


export class AdminUserRoutes {
    static getRoutes(): Router {
        const router = Router();

        // Dependencias para AuthController
        const authDatasource = new AuthDatasourceImpl();
        const customerDatasource = new CustomerMongoDataSourceImpl();
        const authRepository = new AuthRepositoryImpl(authDatasource);
        const customerRepository = new CustomerRepositoryImpl(customerDatasource);
        const emailService = new NodemailerAdapter(); // Asumiendo que lo necesita
        const controller = new AuthController(authRepository, customerRepository, emailService);

        // Rutas de gestión de usuarios para Admin
        router.get('/', (req, res, next) => { controller.getAllUsers(req, res) });
        router.get('/:id', (req, res, next) => { controller.getUserByIdAdmin(req, res) })
        router.put('/:id', (req, res, next) => { controller.updateUser(req, res) }); // Permite actualizar (ej. roles)
        router.delete('/:id', (req, res, next) => { controller.deleteUser(req, res) });

        return router;
    }
}