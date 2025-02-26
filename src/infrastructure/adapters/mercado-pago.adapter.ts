// src/infrastructure/adapters/mercado-pago.adapter.ts
import { MercadoPagoCredentials, MercadoPagoIdempotencyConfig, MercadoPagoPayment, MercadoPagoPreferenceRequest, MercadoPagoPreferenceResponse, MercadoPagoWebhookNotification } from "../../domain/interfaces/payment/mercado-pago.interface";
import { envs } from "../../configs/envs";
import { CustomError } from "../../domain/errors/custom.error";

export class MercadoPagoAdapter {
  private static instance: MercadoPagoAdapter;
  private mercadopago: any;

  private constructor() {
    try {
      // Import the SDK
      this.mercadopago = require('mercadopago');
      
      // Log what the module looks like to help with debugging
      console.log('MercadoPago module structure:', Object.keys(this.mercadopago));
      
      // Configure with the latest SDK pattern
      this.mercadopago.configurations.setAccessToken(envs.MERCADO_PAGO_ACCESS_TOKEN);
      
      console.log('Mercado Pago SDK initialized successfully');
    } catch (error) {
      console.error('Error al cargar el SDK de Mercado Pago:', error);
      throw new Error('No se pudo inicializar el SDK de Mercado Pago');
    }
  }

  public static getInstance(): MercadoPagoAdapter {
    if (!MercadoPagoAdapter.instance) {
      MercadoPagoAdapter.instance = new MercadoPagoAdapter();
    }
    return MercadoPagoAdapter.instance;
  }

  async createPreference(
    preference: MercadoPagoPreferenceRequest,
    config?: MercadoPagoIdempotencyConfig
  ): Promise<MercadoPagoPreferenceResponse> {
    try {
      const options = config ? { idempotency_key: config.idempotencyKey } : undefined;
      
      const response = await this.mercadopago.preferences.create(preference, options);
      return response.body;
    } catch (error) {
      console.error('Error al crear preferencia en Mercado Pago:', error);
      throw CustomError.internalServerError(
        `Error al crear preferencia en Mercado Pago: ${this.parseError(error)}`
      );
    }
  }

  async getPayment(id: string): Promise<MercadoPagoPayment> {
    try {
      const response = await this.mercadopago.payment.get(id);
      return response.body;
    } catch (error) {
      console.error(`Error al obtener el pago con ID ${id} de Mercado Pago:`, error);
      throw CustomError.internalServerError(
        `Error al obtener el pago de Mercado Pago: ${this.parseError(error)}`
      );
    }
  }

  async getPreference(id: string): Promise<MercadoPagoPreferenceResponse> {
    try {
      const response = await this.mercadopago.preferences.get(id);
      return response.body;
    } catch (error) {
      console.error(`Error al obtener la preferencia con ID ${id} de Mercado Pago:`, error);
      throw CustomError.internalServerError(
        `Error al obtener la preferencia de Mercado Pago: ${this.parseError(error)}`
      );
    }
  }

  // Método auxiliar para parsear errores del SDK
  private parseError(error: any): string {
    if (error.response && error.response.body) {
      return JSON.stringify(error.response.body);
    }
    return error.message || 'Error desconocido';
  }

  validateWebhook(notification: MercadoPagoWebhookNotification): boolean {
    return true;
  }

  async setupWebhooks(notificationUrl: string): Promise<void> {
    console.log(`Se configuraría webhook en Mercado Pago para la URL: ${notificationUrl}`);
  }
}