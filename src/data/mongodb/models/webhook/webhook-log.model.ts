import mongoose, { Document, Schema } from 'mongoose';

export interface IWebhookLog extends Document {
  source: string; // 'mercadopago', 'stripe', etc.
  eventType: string; // 'payment', 'preference', etc.
  httpMethod: string; // 'POST', 'GET'
  url: string; // URL del endpoint
  headers: Record<string, any>; // Headers completos
  queryParams: Record<string, any>; // Query parameters
  body: Record<string, any>; // Body completo
  ipAddress?: string; // IP del remitente
  userAgent?: string; // User-Agent
  rawData: string; // Datos completamente crudos como string
  processed: boolean; // Si ya fue procesado
  processingResult?: {
    success: boolean;
    error?: string;
    paymentId?: string;
    orderId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const webhookLogSchema = new Schema<IWebhookLog>({
  source: {
    type: String,
    required: true,
    enum: ['mercadopago', 'stripe', 'paypal', 'other'],
    default: 'mercadopago'
  },
  eventType: {
    type: String,
    required: true
  },
  httpMethod: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  },
  url: {
    type: String,
    required: true
  },
  headers: {
    type: Schema.Types.Mixed,
    required: true
  },
  queryParams: {
    type: Schema.Types.Mixed,
    default: {}
  },
  body: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  rawData: {
    type: String,
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  processingResult: {
    success: {
      type: Boolean
    },
    error: {
      type: String
    },
    paymentId: {
      type: String
    },
    orderId: {
      type: String
    }
  }
}, {
  timestamps: true,
  collection: 'webhookLogs'
});

// Índices para optimizar consultas
webhookLogSchema.index({ source: 1, eventType: 1 });
webhookLogSchema.index({ createdAt: -1 });
webhookLogSchema.index({ processed: 1 });
webhookLogSchema.index({ 'processingResult.paymentId': 1 });

export const WebhookLogModel = mongoose.model<IWebhookLog>('WebhookLog', webhookLogSchema);
