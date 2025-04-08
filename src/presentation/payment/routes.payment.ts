// src/presentation/payment/routes.payment.ts

import { Router } from "express";
import { PaymentController } from "./controller.payment";
import { PaymentMongoDataSourceImpl } from "../../infrastructure/datasources/payment/payment.mongo.datasource.impl";
import { PaymentRepositoryImpl } from "../../infrastructure/repositories/payment/payment.repository.impl";
import { OrderMongoDataSourceImpl } from "../../infrastructure/datasources/order/order.mongo.datasource.impl";
import { CustomerMongoDataSourceImpl } from "../../infrastructure/datasources/customers/customer.mongo.datasource.impl";
import { OrderRepositoryImpl } from "../../infrastructure/repositories/order/order.repository.impl";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customers/customer.repository.impl";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class PaymentRoutes {
  static get getPaymentRoutes(): Router {
    const router = Router();

    // Inicializamos las dependencias
    const paymentDatasource = new PaymentMongoDataSourceImpl();
    const saleDatasource = new OrderMongoDataSourceImpl();
    const customerDatasource = new CustomerMongoDataSourceImpl();

    const paymentRepository = new PaymentRepositoryImpl(paymentDatasource);
    const saleRepository = new OrderRepositoryImpl(saleDatasource);
    const customerRepository = new CustomerRepositoryImpl(customerDatasource);

    const controller = new PaymentController(
      paymentRepository,
      saleRepository,
      customerRepository
    );

    // Rutas públicas (no requieren autenticación)
    // Webhooks y callbacks de MercadoPago
    router.post("/webhook", controller.processWebhook);
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

    //estos son los pagos que he hecho en mercado pago del ultimo año
    router.get("/mercadopago/payments", controller.getAllMercadoPagoPayments);

    //estos son los cobros que he hecho en mercado pago del ultimo año
    router.get("/mercadopago/charges", controller.getAllMercadoPagoCharges);

    // Ruta nueva usando el método simplificado
    router.post("/prueba/sale/:saleId", controller.createPaymentPrueba);

    return router;
  }
}