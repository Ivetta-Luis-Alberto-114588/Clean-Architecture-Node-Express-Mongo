// src/configs/payment.ts
import { MercadoPagoPaymentAdapter } from "../infrastructure/adapters/mercado-pago-payment.adapter";
import { loggerService } from "./logger";
import { envs } from "./envs";

/**
 * Configuración centralizada del servicio de pagos.
 * Usa la abstracción IPaymentService con la implementación de MercadoPago.
 */
export const paymentService = new MercadoPagoPaymentAdapter(
    {
        accessToken: envs.MERCADO_PAGO_ACCESS_TOKEN
    },
    loggerService
);
