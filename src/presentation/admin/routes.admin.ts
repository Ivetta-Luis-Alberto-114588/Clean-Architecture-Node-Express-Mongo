// src/presentation/admin/routes.admin.ts
import { Router } from "express";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AdminCategoryRoutes } from "./products/routes.admin.category";
import { AdminProductRoutes } from "./products/routes.admin.product";
import { AdminUnitRoutes } from "./products/routes.admin.unit";
import { AdminOrderRoutes } from "./orders/routes.admin.order";
import { AdminCityRoutes } from "./customers/routes.admin.city";
import { AdminNeighborhoodRoutes } from "./customers/routes.admin.neighborhood";
import { AdminCustomerRoutes } from "./customers/routes.admin.customer";
import { AdminUserRoutes } from "./users/routes.admin.user";
import { AdminCouponRoutes } from "./coupons/routes.admin.coupon";
// import { AdminAddressRoutes } from "./customers/routes.admin.address"; // Podrías crear este

export class AdminRoutes {

    static get getAdminRoutes(): Router {
        const router = Router();

        router.use(AuthMiddleware.validateJwt);
        router.use(AuthMiddleware.checkRole(['ADMIN_ROLE']));

        router.use('/products', AdminProductRoutes.getRoutes());
        router.use('/categories', AdminCategoryRoutes.getRoutes());
        router.use('/units', AdminUnitRoutes.getRoutes());
        router.use('/orders', AdminOrderRoutes.getRoutes());
        router.use('/customers', AdminCustomerRoutes.getRoutes());
        router.use('/users', AdminUserRoutes.getRoutes());
        router.use('/coupons', AdminCouponRoutes.getRoutes());
        router.use('/cities', AdminCityRoutes.getRoutes());
        router.use('/neighborhoods', AdminNeighborhoodRoutes.getRoutes());
        // router.use('/addresses', AdminAddressRoutes.getRoutes()); // Para ver/gestionar TODAS las direcciones

        return router;
    }
}