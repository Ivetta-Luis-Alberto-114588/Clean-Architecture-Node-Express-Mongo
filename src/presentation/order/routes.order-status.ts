// src/presentation/order/routes.order-status.ts
import { Router } from "express";
import { OrderStatusController } from "./controller.order-status";
import { OrderStatusRepository } from "../../domain/repositories/order/order-status.repository";
import { OrderStatusRepositoryImpl } from "../../infrastructure/repositories/order/order-status.repository.impl";
import { OrderStatusMongoDataSourceImpl } from "../../infrastructure/datasources/order/order-status.mongo.datasource.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { ADMIN_ROLES } from "../../configs/roles";

export class OrderStatusRoutes {
    static get routes(): Router {
        const router = Router();

        // Dependencias
        const orderStatusDataSource = new OrderStatusMongoDataSourceImpl();
        const orderStatusRepository: OrderStatusRepository = new OrderStatusRepositoryImpl(orderStatusDataSource);
        const orderStatusController = new OrderStatusController(orderStatusRepository);        // Rutas públicas (para obtener estados activos)
        router.get('/active', orderStatusController.getActiveOrderStatuses); // Solo estados activos
        router.get('/default', orderStatusController.getDefaultOrderStatus);
        router.get('/code/:code', orderStatusController.getOrderStatusByCode);

        // Rutas protegidas (solo para administradores)
        // Aplicar middleware directamente a cada ruta protegida
        router.get('/',
            AuthMiddleware.validateJwt,
            AuthMiddleware.checkRole(ADMIN_ROLES),
            orderStatusController.getOrderStatuses
        );
        router.post('/',
            AuthMiddleware.validateJwt,
            AuthMiddleware.checkRole(ADMIN_ROLES),
            orderStatusController.createOrderStatus
        );
        router.get('/:id',
            AuthMiddleware.validateJwt,
            AuthMiddleware.checkRole(ADMIN_ROLES),
            orderStatusController.getOrderStatusById
        );
        router.put('/:id',
            AuthMiddleware.validateJwt,
            AuthMiddleware.checkRole(ADMIN_ROLES),
            orderStatusController.updateOrderStatus
        );
        router.patch('/:id/transitions',
            AuthMiddleware.validateJwt,
            AuthMiddleware.checkRole(ADMIN_ROLES),
            orderStatusController.updateOrderStatusTransitions
        );
        router.delete('/:id',
            AuthMiddleware.validateJwt,
            AuthMiddleware.checkRole(ADMIN_ROLES),
            orderStatusController.deleteOrderStatus
        );

        // Validación de transiciones
        router.post('/validate-transition',
            AuthMiddleware.validateJwt,
            AuthMiddleware.checkRole(ADMIN_ROLES),
            orderStatusController.validateTransition
        );

        return router;
    }
}
