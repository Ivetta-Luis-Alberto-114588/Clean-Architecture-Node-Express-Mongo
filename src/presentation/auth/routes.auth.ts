import { Router } from "express";
import { AuthController } from "./controller.auth";
import { AuthRepositoryImpl } from "../../infrastructure/repositories/auth.repository.impl";
import { AuthDatasourceImpl } from "../../infrastructure/datasources/mongo.auth.datasource.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";



export class AuthRoutes { 

    static get getAuthRoutes() : Router {
        
        const router = Router()
        const database = new AuthDatasourceImpl()
        const authRepository = new AuthRepositoryImpl(database)
        const controller = new AuthController(authRepository)

        router.post("/register", controller.registerUser)
        router.post("/login", controller.loginUser)
        router.get("/", AuthMiddleware.validateJwt, controller.getUsers)
        router.delete( "/:id", controller.deleteUser)
        router.put("/:id", controller.updateUser)
        
        //TODO  delete, update, etc
        
        return router
    }


}