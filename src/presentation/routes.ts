// src/presentation/routes.ts
import { Request, Response, Router } from "express";
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
import { TagRoutes } from "./products/routes.tag";

export class MainRoutes {

    static get getMainRoutes(): Router {

        const router = Router()


        // Responder a GET y HEAD en la raíz
        router.all('/', (req: Request, res: Response) => {
            // HEAD no necesita cuerpo, GET sí
            if (req.method === 'HEAD') {
                res.status(200).end(); // Solo estado 200 y cabeceras
            } else {
                res.status(200).json({ message: 'API E-commerce V1 - Running OK' });
            }
        });

        router.get('/ping', (req: Request, res: Response) => {
            res.status(200).send('pong');
        });

        // Rutas Públicas / de Usuario
        router.use("/api/auth", AuthRoutes.getAuthRoutes);
        router.use("/api/products", ProductRoutes.getProductRoutes);
        router.use("/api/categories", CategoryRoutes.getCategoryRoutes);
        router.use("/api/units", UnitRoutes.getUnitRoutes);
        router.use("/api/tags", TagRoutes.getRoutes); // <<<--- Rutas de Tags (si las necesitas)
        router.use("/api/cities", CityRoutes.getCityRoutes);
        router.use("/api/neighborhoods", NeighborhoodRoutes.getNeighborhoodRoutes);
        router.use("/api/customers", CustomerRoutes.getCustomerRoutes);
        router.use("/api/addresses", AddressRoutes.getRoutes);
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