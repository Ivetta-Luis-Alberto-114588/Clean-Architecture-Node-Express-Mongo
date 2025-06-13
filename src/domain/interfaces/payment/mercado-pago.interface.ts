// src/domain/interfaces/payment/mercado-pago.interface.ts

// Interfaces para tipar las respuestas de Mercado Pago
export interface MercadoPagoCredentials {
  accessToken: string;
  publicKey?: string;
}
// Información del pagador
export interface MercadoPagoPayer {
  id?: string;
  name: string;
  surname: string;
  email: string;
  phone?: {
    area_code: string;
    number: string;
  };
  identification?: {
    type: string;
    number: string;
  };
  address?: {
    zip_code: string;
    street_name: string;
    street_number: number;
  };
}

// Información del ítem a pagar
export interface MercadoPagoItem {
  id: string;
  title: string;
  description: string;
  picture_url?: string;
  category_id?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}
// Configuración de la preferencia de pago
export interface MercadoPagoPreferenceRequest {
  items: MercadoPagoItem[];
  payer?: MercadoPagoPayer;
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
  notification_url?: string;
  statement_descriptor?: string;
  external_reference?: string;
  expires?: boolean;
  expiration_date_from?: string;
  expiration_date_to?: string;
  metadata?: any;
}

// Respuesta de la creación de preferencia
export interface MercadoPagoPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
  date_created: string;
  items: MercadoPagoItem[];
  payer: MercadoPagoPayer;
  collector_id: number;
  external_reference: string;
  notification_url: string;
}

// Estados posibles del pago
export enum MercadoPagoPaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  AUTHORIZED = 'authorized',
  IN_PROCESS = 'in_process',
  IN_MEDIATION = 'in_mediation',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGED_BACK = 'charged_back'
}
// Información del pago
export interface MercadoPagoPayment {
  id: number;
  date_created: string;
  date_approved: string;
  date_last_updated: string;
  money_release_date: string;
  operation_type: string;
  payment_method_id: string;
  payment_type_id: string;
  status: MercadoPagoPaymentStatus;
  status_detail: string;
  currency_id: string;
  description: string;
  collector_id: number;
  payer: MercadoPagoPayer;
  metadata: any;
  additional_info: any;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  external_reference: string;
  transaction_details: {
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    installment_amount: number;
  };
  fee_details: Array<{
    type: string;
    amount: number;
  }>;
  statement_descriptor: string;
  installments: number;
  card?: {
    id: string;
    first_six_digits: string;
    last_four_digits: string;
    expiration_month: number;
    expiration_year: number;
    date_created: string;
    date_last_updated: string;
    cardholder: {
      name: string;
      identification: {
        number: string;
        type: string;
      };
    };
  };
}

// Notificación de webhook
export interface MercadoPagoWebhookNotification {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice' | 'point_integration_wh';
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

// Configuración de idempotencia
export interface MercadoPagoIdempotencyConfig {
  idempotencyKey: string;
  retryAttempts?: number;
  retryDelay?: number;
}