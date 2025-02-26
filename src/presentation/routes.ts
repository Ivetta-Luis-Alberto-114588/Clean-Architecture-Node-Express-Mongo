import { Router } from "express";
import { AuthRoutes } from "./auth/routes.auth";
import { ProductRoutes } from "./products/routes.product";
import { CategoryRoutes } from "./products/routes.category.";
import { UnitRoutes } from "./products/routes.unit";
import { CityRoutes } from "./customers/routes.city";
import { NeighborhoodRoutes } from "./customers/routes.neighborhood";
import { CustomerRoutes } from "./customers/routes.customer";
import { SaleRoutes } from "./sales/routes.sale";
import { PaymentRoutes } from "./payment/routes.payment";



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

        // Rutas de ventas
        router.use("/api/sales", SaleRoutes.getSaleRoutes);


        // Rutas de pagos con Mercado Pago
        router.use("/api/payments", PaymentRoutes.getPaymentRoutes);
        
        // router.use("/api/user")
        // router.use("/api/products")
        // router.use("/api/clients")
        // router.use("/api/orders")
        
        return router
    }


}