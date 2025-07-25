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
import { OrderStatusRoutes } from "./order/routes.order-status";
import { PaymentMethodRoutes } from "./payment/routes.payment-method";
import { MonitoringRoutes } from "./monitoring/routes.monitoring";
import { MCPRoutes } from "./mcp/routes.mcp"; // <<<--- NUEVA IMPORTACIÓN
import { IntelligentRoutes } from "./intelligent/intelligent.routes"; // <<<--- SISTEMA INTELIGENTE
import { WebhookRoutes } from "./webhook/routes.webhook"; // <<<--- WEBHOOK ROUTES
import { DeliveryMethodRoutes } from "./delivery-methods/routes"; // <<<--- DELIVERY METHODS ROUTES
import { manualNotificationRoutes } from './notifications';
import mongoose from "mongoose";

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

        // Health Check endpoints
        router.get('/api/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                service: 'E-commerce Backend API',
                version: '1.0.0'
            });
        });

        router.get('/api/health/db', (req: Request, res: Response) => {
            const dbState = mongoose.connection.readyState;
            const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

            if (dbState === 1) {
                res.status(200).json({
                    database: 'connected',
                    dbName: mongoose.connection.db?.databaseName || 'unknown',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(503).json({
                    database: dbStatus,
                    error: 'Database not available',
                    timestamp: new Date().toISOString()
                });
            }
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
        router.use("/api/orders", OrderRoutes.getOrderRoutes);
        router.use("/api/payments", PaymentRoutes.getPaymentRoutes);
        router.use("/api/payment-methods", PaymentMethodRoutes.routes);
        router.use("/api/chatbot", ChatbotRoutes.getChatbotRoutes);
        router.use("/api/cart", CartRoutes.getCartRoutes);
        router.use("/api/coupons", CouponRoutes.getCouponRoutes);
        router.use("/api/order-statuses", OrderStatusRoutes.routes);
        router.use("/api/delivery-methods", DeliveryMethodRoutes.routes); // <<<--- DELIVERY METHODS ROUTES// Rutas de Administración
        router.use("/api/admin", AdminRoutes.getAdminRoutes);        // Rutas de Monitoreo
        router.use("/api/monitoring", MonitoringRoutes.routes);

        // Rutas de Webhooks (Admin)
        router.use("/api/webhooks", WebhookRoutes.routes);

        // Rutas MCP
        router.use("/api/mcp", MCPRoutes.getMCPRoutes); // <<<--- NUEVA RUTA

        // Rutas del Sistema Inteligente (LangChain + Claude)
        router.use("/api/intelligent", IntelligentRoutes.routes); // <<<--- SISTEMA INTELIGENTE

        // Rutas de Notificaciones Manuales
        router.use('/api/notifications', manualNotificationRoutes);

        return router
    }
}