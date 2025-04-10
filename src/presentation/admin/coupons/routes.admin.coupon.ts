// src/presentation/admin/coupons/routes.admin.coupon.ts
import { Router } from "express";
import { CouponController } from "../../coupon/controller.coupon"; // Reutilizar
import { CouponMongoDataSourceImpl } from "../../../infrastructure/datasources/coupon/coupon.mongo.datasource.impl";
import { CouponRepositoryImpl } from "../../../infrastructure/repositories/coupon/coupon.repository.impl";

export class AdminCouponRoutes {
    static getRoutes(): Router {
        const router = Router();

        // Dependencias
        const datasource = new CouponMongoDataSourceImpl();
        const repository = new CouponRepositoryImpl(datasource);
        const controller = new CouponController(repository);

        // Rutas CRUD Admin (ya estaban protegidas, aquí solo las agrupamos)
        router.post('/', (req, res, next) => { controller.createCoupon(req, res) });
        router.get('/', (req, res, next) => { controller.getAllCoupons(req, res) });
        router.get('/:id', controller.getCouponById);
        router.put('/:id', controller.updateCoupon);
        router.delete('/:id', controller.deleteCoupon);

        return router;
    }
}