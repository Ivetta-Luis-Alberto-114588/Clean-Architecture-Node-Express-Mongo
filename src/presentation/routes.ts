// src/presentation/routes.ts
import { Router } from "express";
import { AuthRoutes } from "./auth/routes.auth";
import { ProductRoutes } from "./products/routes.product";
import { CategoryRoutes } from "./products/routes.category.";
import { UnitRoutes } from "./products/routes.unit";
import { CityRoutes } from "./customers/routes.city";
import { NeighborhoodRoutes } from "./customers/routes.neighborhood";
import { CustomerRoutes } from "./customers/routes.customer";
import { AddressRoutes } from "./customers/routes.address"; // <<<--- IMPORTAR
import { OrderRoutes } from "./order/routes.order";
import { PaymentRoutes } from "./payment/routes.payment";
import { ChatbotRoutes } from "./chatbot/routes.chatbot";
import { CartRoutes } from "./cart/routes.cart";
import { CouponRoutes } from "./coupon/routes.coupon";
import { AdminRoutes } from "./admin/routes.admin";

export class MainRoutes {

    static get getMainRoutes(): Router {

        const router = Router()

        // Rutas Públicas / de Usuario
        router.use("/api/auth", AuthRoutes.getAuthRoutes);
        router.use("/api/products", ProductRoutes.getProductRoutes);
        router.use("/api/categories", CategoryRoutes.getCategoryRoutes);
        router.use("/api/units", UnitRoutes.getUnitRoutes);
        router.use("/api/cities", CityRoutes.getCityRoutes);
        router.use("/api/neighborhoods", NeighborhoodRoutes.getNeighborhoodRoutes);
        router.use("/api/customers", CustomerRoutes.getCustomerRoutes);
        router.use("/api/addresses", AddressRoutes.getRoutes); // <<<--- AÑADIDO
        router.use("/api/sales", OrderRoutes.getOrderRoutes);
        router.use("/api/payments", PaymentRoutes.getPaymentRoutes);
        router.use("/api/chatbot", ChatbotRoutes.getChatbotRoutes);
        router.use("/api/cart", CartRoutes.getCartRoutes);
        router.use("/api/coupons", CouponRoutes.getCouponRoutes);

        // Rutas de Administración
        router.use("/api/admin", AdminRoutes.getAdminRoutes);

        return router
    }
}