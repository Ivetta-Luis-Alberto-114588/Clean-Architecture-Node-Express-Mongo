import { Router } from "express";
import { AuthController } from "./controller.auth";



export class AuthRoutes { 

    static get routes() : Router {
        
        const router = Router()
        const controller = new AuthController()

        router.post("/register", controller.registerUser)

        router.post("/login", controller.loginrUser)
        
        
        return router
    }


}