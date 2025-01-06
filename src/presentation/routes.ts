import { Router } from "express";
import { AuthRoutes } from "./auth/routes.auth";



export class AppRoutes { 

    static get routes() : Router {
        
        const router = Router()

        router.use("/api/auth", AuthRoutes.routes)
        // router.use("/api/user")
        // router.use("/api/products")
        // router.use("/api/clients")
        // router.use("/api/orders")
        
        return router
    }


}