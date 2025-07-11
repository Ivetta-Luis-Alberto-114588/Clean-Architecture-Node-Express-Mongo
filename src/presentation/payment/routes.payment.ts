import { Router } from "express";
import { PaymentController } from "./controller.payment";
import { PaymentMongoDataSourceImpl } from "../../infrastructure/datasources/payment/payment.mongo.datasource.impl";
import { PaymentRepositoryImpl } from "../../infrastructure/repositories/payment/payment.repository.impl";
import { OrderMongoDataSourceImpl } from "../../infrastructure/datasources/order/order.mongo.datasource.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { OrderStatusMongoDataSourceImpl } from "../../infrastructure/datasources/order/order-status.mongo.datasource.impl";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order/order.repository.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { OrderStatusRepositoryImpl } from "../../infrastructure/repositories/order/order-status.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { WebhookLoggerMiddleware } from "../middlewares/webhook-logger.middleware";
import { loggerService } from "../../configs/logger";
import { paymentService } from "../../configs/payment";
import { notificationService } from "../../configs/notification";

export class PaymentRoutes {
  static get getPaymentRoutes(): Router {
    const router = Router();    // Inicializamos las dependencias
    const paymentDatasource = new PaymentMongoDataSourceImpl();
    const saleDatasource = new OrderMongoDataSourceImpl();
    const customerDatasource = new CustomerMongoDataSourceImpl();
    const orderStatusDatasource = new OrderStatusMongoDataSourceImpl();    // Inicializar repositorios
    const paymentRepository = new PaymentRepositoryImpl(paymentDatasource);
    const saleRepository = new OrderRepositoryImpl(saleDatasource);
    const customerRepository = new CustomerRepositoryImpl(customerDatasource);
    const orderStatusRepository = new OrderStatusRepositoryImpl(orderStatusDatasource);

    const controller = new PaymentController(
      paymentRepository,
      saleRepository,
      customerRepository,
      orderStatusRepository,
      paymentService,
      loggerService,
      notificationService
    );    // Rutas públicas (no requieren autenticación)
    // Webhooks y callbacks de MercadoPago
    router.post(
      "/webhook",
      WebhookLoggerMiddleware.captureRawWebhook,
      WebhookLoggerMiddleware.updateProcessingResult,
      controller.processWebhook
    );
    router.get("/success", controller.paymentSuccess);
    router.get("/failure", controller.paymentFailure);
    router.get("/pending", controller.paymentPending);

    // Rutas protegidas (requieren autenticación)
    // Crear y gestionar pagos
    router.post("/sale/:saleId", controller.createPayment);
    router.get("/:id", controller.getPayment);
    router.get("/by-sale/:saleId", controller.getPaymentsBySale);
    router.get("/", controller.getAllPayments);
    router.post("/verify", controller.verifyPayment);
    router.get("/preference/:preferenceId", controller.verifyPreferenceStatus);

    // Nuevo endpoint para verificar estado por venta (desde frontend)
    router.get("/status/sale/:saleId", [AuthMiddleware.validateJwt], controller.getPaymentStatusBySale);

    // NUEVO: Verificación manual de pagos
    router.post("/manual-verify/:orderId", controller.manualPaymentVerification);

    //estos son los pagos que he hecho en mercado pago del ultimo año
    router.get("/mercadopago/payments", controller.getAllMercadoPagoPayments);

    //estos son los cobros que he hecho en mercado pago del ultimo año
    router.get("/mercadopago/charges", controller.getAllMercadoPagoCharges);

    // Ruta nueva usando el método simplificado
    router.post("/prueba/sale/:saleId", controller.createPaymentPrueba);

    return router;
  }
}