import { Router } from "express";
import { AuthController } from "./controller.auth";
import { AuthRepositoryImpl } from "../../infrastructure/repositories/auth.repository.impl";
import { AuthDatasourceImpl } from "../../infrastructure/datasources/auth.mongo.datasource.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { RateLimitMiddleware } from "../middlewares/rate-limit.middleware";



export class AuthRoutes { 

    static get getAuthRoutes() : Router {
        
        const router = Router()
        const database = new AuthDatasourceImpl()
        const authRepository = new AuthRepositoryImpl(database)
        const controller = new AuthController(authRepository)

        router.post("/register", controller.registerUser)
        router.post("/login",[RateLimitMiddleware.getAuthRateLimit()]  ,controller.loginUser)  //limito las peticiones a 3 por hora
        router.get("/", [AuthMiddleware.validateJwt], controller.getUserByToken)
        router.get("/all", controller.getAllUsers)
        router.delete( "/:id", controller.deleteUser)
        router.put("/:id", controller.updateUser)
        
       
        return router
    }


}