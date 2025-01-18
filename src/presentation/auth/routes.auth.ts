import { Router } from "express";
import { AuthController } from "./controller.auth";
import { AuthRepositoryImpl } from "../../infrastructure/repositories/auth.repository.impl";
import { AuthDatasourceImpl } from "../../infrastructure/datasources/auth.datasource.impl";



export class AuthRoutes { 

    static get getAuthRoutes() : Router {
        
        const router = Router()
        const database = new AuthDatasourceImpl()
        const authRepository = new AuthRepositoryImpl(database)
        const controller = new AuthController(authRepository)

        router.post("/register", controller.registerUser)
        router.post("/login", controller.loginUser)

        
        
        return router
    }


}