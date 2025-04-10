// src/presentation/coupon/routes.coupon.ts
import { Router } from "express";
import { CouponController } from "./controller.coupon";
import { CouponMongoDataSourceImpl } from "../../infrastructure/datasources/coupon/coupon.mongo.datasource.impl";
import { CouponRepositoryImpl } from "../../infrastructure/repositories/coupon/coupon.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware"; // Importar middleware

export class CouponRoutes {

    static get getCouponRoutes(): Router {
        const router = Router();

        const datasource = new CouponMongoDataSourceImpl();
        const repository = new CouponRepositoryImpl(datasource);
        const controller = new CouponController(repository);

        // --- Middleware de Autenticación y Roles ---
        // Aplicar a todas las rutas de gestión de cupones
        // En el futuro, añadirías un middleware para verificar rol de ADMIN
        router.use(AuthMiddleware.validateJwt);
        // router.use(AuthMiddleware.checkRole(['ADMIN_ROLE'])); // Descomentar cuando implementes checkRole

        // --- Rutas CRUD ---
        router.post('/', (req, res, next) => { controller.createCoupon(req, res) });
        router.get('/', (req, res, next) => { controller.getAllCoupons(req, res) });
        router.get('/:id', controller.getCouponById);
        router.put('/:id', controller.updateCoupon);
        router.delete('/:id', controller.deleteCoupon); // O podría ser PATCH para desactivar

        return router;
    }
}