// src/infrastructure/adapters/mercado-pago.adapter.ts

import { MercadoPagoCredentials, MercadoPagoIdempotencyConfig, MercadoPagoPayment, MercadoPagoPreferenceRequest, MercadoPagoPreferenceResponse, MercadoPagoWebhookNotification } from "../../domain/interfaces/payment/mercado-pago.interface";
import { envs } from "../../configs/envs";
import { CustomError } from "../../domain/errors/custom.error";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid'; // Asegúrate de tener uuid instalado: npm install uuid @types/uuid

export class MercadoPagoAdapter {
  private static instance: MercadoPagoAdapter;
  private readonly baseUrl = 'https://api.mercadopago.com';
  private readonly accessToken: string;

  private constructor() {
    this.accessToken = envs.MERCADO_PAGO_ACCESS_TOKEN;
    console.log('MercadoPago REST API adapter initialized');
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
      // Armo los headers que le voy a enviar a mercado pago
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      };
      
      if (config?.idempotencyKey) {
        headers['X-Idempotency-Key'] = config.idempotencyKey;
      }
      
            
      // Guardo la respuesta de axios de mercado pago
      const response = await axios.post( `${this.baseUrl}/checkout/preferences`, preference, { headers }  ); 

      // console.log('items:', {data: response.data.items});      
      // console.log('respuesta de axios a la url de mercado pago:', {data: response.data});      
       
      return response.data;

    } catch (error) {
      console.error('Error al crear preferencia en Mercado Pago:', error);
      throw CustomError.internalServerError(
        `Error al crear preferencia en Mercado Pago: ${this.parseError(error)}`
      );
    }
  }

  // Nuevo método con estructura fija
  async preferencePrueba(
    req: any,
    config?: MercadoPagoIdempotencyConfig
  ): Promise<MercadoPagoPreferenceResponse> {
    try {
      // Armo los headers para enviar a Mercado Pago
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      };
      
      if (config?.idempotencyKey) {
        headers['X-Idempotency-Key'] = config.idempotencyKey;
      }
      
      // Estructura fija para la preferencia
      const body = {
        items: [
          {
            id:  "1234",
            title:  "title", 
            quantity: 1,
            unit_price: 100
          }
        ],
        back_urls: {
          failure: "/failure",
          pending: "/pending",
          success: "/success"
        },
        "notification_url": "https://5wl9804f-3001.brs.devtunnels.ms/webHook",
        "auto_return": "approved",
        "statement_descriptor": "Negocio startUp",
        "metadata": { uuid: uuidv4() }
      };
      
      console.log('Enviando body a MercadoPago:', body);
      
      // Guardo la respuesta de axios de mercado pago
      const response = await axios.post(`${this.baseUrl}/checkout/preferences`, body, { headers }); 

      console.log('Preferencia creada con éxito:', response.data);
      
      return response.data;

    } catch (error) {
      console.error('Error al crear preferencia en Mercado Pago:', error);
      throw CustomError.internalServerError(
        `Error al crear preferencia en Mercado Pago: ${this.parseError(error)}`
      );
    }
  }

  async getPayment(id: string): Promise<MercadoPagoPayment> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payments/${id}`, 
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el pago con ID ${id} de Mercado Pago:`, error);
      throw CustomError.internalServerError(
        `Error al obtener el pago de Mercado Pago: ${this.parseError(error)}`
      );
    }
  }

  async getPreference(id: string): Promise<MercadoPagoPreferenceResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/checkout/preferences/${id}`, 
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error al obtener la preferencia con ID ${id} de Mercado Pago:`, error);
      throw CustomError.internalServerError(
        `Error al obtener la preferencia de Mercado Pago: ${this.parseError(error)}`
      );
    }
  }

  // Método auxiliar para parsear errores de axios
  private parseError(error: any): string {
    if (axios.isAxiosError(error) && error.response) {
      return JSON.stringify(error.response.data);
    }
    return error.message || 'Error desconocido';
  }

  validateWebhook(notification: MercadoPagoWebhookNotification): boolean {
    // Implementa la lógica de validación de webhooks según la documentación de MP
    return true;
  }

  async setupWebhooks(notificationUrl: string): Promise<void> {
    console.log(`Se configuraría webhook en Mercado Pago para la URL: ${notificationUrl}`);
    // Implementa la configuración de webhooks si lo necesitas
  }
}