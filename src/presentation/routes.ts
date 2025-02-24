import { Router } from "express";
import { AuthRoutes } from "./auth/routes.auth";
import { ProductRoutes } from "./products/routes.product";
import { CategoryRoutes } from "./products/routes.category.";
import { UnitRoutes } from "./products/routes.unit";
import { CityRoutes } from "./customers/routes.city";
import { NeighborhoodRoutes } from "./customers/routes.neighborhood";
import { CustomerRoutes } from "./customers/routes.customer";



export class MainRoutes { 

    static get getMainRoutes() : Router {
        
        const router = Router()

         // Rutas de usuarios y autenticación 
        router.use("/api/auth", AuthRoutes.getAuthRoutes)
        
        // Rutas de productos
        router.use("/api/products", ProductRoutes.getProductRoutes);
        router.use("/api/categories", CategoryRoutes.getCategoryRoutes);
        router.use("/api/units", UnitRoutes.getUnitRoutes);

        // Rutas de clientes
        router.use("/api/cities", CityRoutes.getCityRoutes);
        router.use("/api/neighborhoods", NeighborhoodRoutes.getNeighborhoodRoutes);
        router.use("/api/customers", CustomerRoutes.getCustomerRoutes);
        
        // router.use("/api/user")
        // router.use("/api/products")
        // router.use("/api/clients")
        // router.use("/api/orders")
        
        return router
    }


}