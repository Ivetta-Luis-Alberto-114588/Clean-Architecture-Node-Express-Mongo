// src/presentation/auth/routes.auth.ts
import { Router, Request, Response } from "express";
import { AuthController } from "./controller.auth";
import { AuthRepositoryImpl } from "../../infrastructure/repositories/auth.repository.impl";
import { AuthDatasourceImpl } from "../../infrastructure/datasources/auth.mongo.datasource.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { RateLimitMiddleware } from "../middlewares/rate-limit.middleware";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl"; // <<<--- IMPORTAR Repo
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl"; // <<<--- IMPORTAR DS

export class AuthRoutes {

    static get getAuthRoutes(): Router {

        const router = Router();
        const authDatasource = new AuthDatasourceImpl();
        const customerDatasource = new CustomerMongoDataSourceImpl(); // <<<--- INSTANCIAR DS
        const authRepository = new AuthRepositoryImpl(authDatasource);
        const customerRepository = new CustomerRepositoryImpl(customerDatasource); // <<<--- INSTANCIAR Repo

        // <<<--- Pasar customerRepository al Controller --- >>>
        const controller = new AuthController(authRepository, customerRepository);

        // ... (resto de las definiciones de rutas sin cambios) ...
        router.post("/register", (req: Request, res: Response) => {
            controller.registerUser(req, res);
        });

        router.post("/login", [RateLimitMiddleware.getAuthRateLimit()], (req: Request, res: Response) => {
            controller.loginUser(req, res);
        });

        router.get("/", [AuthMiddleware.validateJwt], (req: Request, res: Response) => {
            controller.getUserByToken(req, res);
        });

        router.get("/all", (req: Request, res: Response) => {
            controller.getAllUsers(req, res);
        });

        router.delete("/:id", (req: Request, res: Response) => {
            controller.deleteUser(req, res);
        });

        router.put("/:id", (req: Request, res: Response) => {
            controller.updateUser(req, res);
        });

        return router;
    }
}