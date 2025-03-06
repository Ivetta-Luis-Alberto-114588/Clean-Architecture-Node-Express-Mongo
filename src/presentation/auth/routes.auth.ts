import { Router, Request, Response } from "express";
import { AuthController } from "./controller.auth";
import { AuthRepositoryImpl } from "../../infrastructure/repositories/auth.repository.impl";
import { AuthDatasourceImpl } from "../../infrastructure/datasources/auth.mongo.datasource.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { RateLimitMiddleware } from "../middlewares/rate-limit.middleware";

export class AuthRoutes { 

    static get getAuthRoutes() : Router {
        
        const router = Router();
        const database = new AuthDatasourceImpl();
        const authRepository = new AuthRepositoryImpl(database);
        const controller = new AuthController(authRepository);

        // Corregimos cada ruta usando funciones de callback intermedias para evitar
        // los errores de tipos con Express y los métodos asíncronos
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