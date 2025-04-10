// src/presentation/routes.ts
import { Router } from "express";
import { AuthRoutes } from "./auth/routes.auth";
import { ProductRoutes } from "./products/routes.product";
import { CategoryRoutes } from "./products/routes.category.";
import { UnitRoutes } from "./products/routes.unit";
import { CityRoutes } from "./customers/routes.city";
import { NeighborhoodRoutes } from "./customers/routes.neighborhood";
import { CustomerRoutes } from "./customers/routes.customer";
import { OrderRoutes } from "./order/routes.order";
import { PaymentRoutes } from "./payment/routes.payment";
import { ChatbotRoutes } from "./chatbot/routes.chatbot"; // Importamos las rutas del chatbot
import { CartRoutes } from "./cart/routes.cart";
import { CouponRoutes } from "./coupon/routes.coupon";

export class MainRoutes {

    static get getMainRoutes(): Router {

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
        router.use("/api/sales", OrderRoutes.getSaleRoutes);

        // Rutas de pagos con Mercado Pago
        router.use("/api/payments", PaymentRoutes.getPaymentRoutes);

        // Rutas del chatbot
        router.use("/api/chatbot", ChatbotRoutes.getChatbotRoutes);

        // Rutas del carrito de compras
        router.use("/api/cart", CartRoutes.getCartRoutes);

        // Rutas de Cupones (para administración)
        router.use("/api/coupons", CouponRoutes.getCouponRoutes);

        return router
    }
}