// src/presentation/payment/routes.payment-method.ts

import { Router } from "express";
import { PaymentMethodController } from "./controller.payment-method";
import { PaymentMethodMongoDataSourceImpl } from "../../infrastructure/datasources/payment/payment-method.mongo.datasource.impl";
import { PaymentMethodRepositoryImpl } from "../../infrastructure/repositories/payment/payment-method.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { ADMIN_ROLES } from "../../configs/roles";

export class PaymentMethodRoutes {
    static get routes(): Router {
        const router = Router();

        // Dependencias
        const paymentMethodDataSource = new PaymentMethodMongoDataSourceImpl();
        const paymentMethodRepository = new PaymentMethodRepositoryImpl(paymentMethodDataSource);
        const paymentMethodController = new PaymentMethodController(paymentMethodRepository);

        // Rutas públicas (para consultar métodos de pago activos)
        router.get('/active', paymentMethodController.getActivePaymentMethods); // Solo métodos activos
        router.get('/code/:code', paymentMethodController.getPaymentMethodByCode); // Búsqueda por código

        // Rutas protegidas (solo para administradores)
        // Aplicar middleware directamente a cada ruta protegida
        router.get('/', 
            AuthMiddleware.validateJwt, 
            AuthMiddleware.checkRole(ADMIN_ROLES), 
            paymentMethodController.getPaymentMethods
        );
        router.post('/', 
            AuthMiddleware.validateJwt, 
            AuthMiddleware.checkRole(ADMIN_ROLES), 
            paymentMethodController.createPaymentMethod
        );
        router.get('/:id', 
            AuthMiddleware.validateJwt, 
            AuthMiddleware.checkRole(ADMIN_ROLES), 
            paymentMethodController.getPaymentMethodById
        );
        router.put('/:id', 
            AuthMiddleware.validateJwt, 
            AuthMiddleware.checkRole(ADMIN_ROLES), 
            paymentMethodController.updatePaymentMethod
        );
        router.delete('/:id', 
            AuthMiddleware.validateJwt, 
            AuthMiddleware.checkRole(ADMIN_ROLES), 
            paymentMethodController.deletePaymentMethod
        );

        return router;
    }
}
