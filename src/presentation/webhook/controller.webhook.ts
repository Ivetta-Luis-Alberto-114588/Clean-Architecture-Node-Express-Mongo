import { Request, Response } from 'express';
import { WebhookLogModel } from '../../data/mongodb/models/webhook/webhook-log.model';
import { PaginationDto } from '../../domain/dtos/shared/pagination.dto';
import { CustomError } from '../../domain/errors/custom.error';
import { IPaymentService } from '../../domain/interfaces/payment.service';
import { ILogger } from '../../domain/interfaces/logger.interface';
import { MercadoPagoAdapter } from '../../infrastructure/adapters/mercado-pago.adapter';

export class WebhookController {

  constructor(
    private readonly paymentService: IPaymentService,
    private readonly logger: ILogger,
    private readonly mercadoPagoAdapter: MercadoPagoAdapter = MercadoPagoAdapter.getInstance()
  ) { }

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error("Error en WebhookController:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  };

  getAllWebhooks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, source, eventType, processed } = req.query;

      const [error, paginationDto] = PaginationDto.create(Number(page), Number(limit));
      if (error) {
        res.status(400).json({ error });
        return;
      }

      const filters: any = {};
      if (source) filters.source = source;
      if (eventType) filters.eventType = eventType;
      if (processed !== undefined) filters.processed = processed === 'true'; const total = await WebhookLogModel.countDocuments(filters);
      const skip = (paginationDto!.page - 1) * paginationDto!.limit;
      const webhooks = await WebhookLogModel
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(paginationDto!.limit)
        .lean();

      res.json({
        total,
        webhooks,
        pagination: {
          page: paginationDto!.page,
          limit: paginationDto!.limit,
          totalPages: Math.ceil(total / paginationDto!.limit)
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  };

  getWebhookById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const webhook = await WebhookLogModel.findById(id);
      if (!webhook) {
        res.status(404).json({ error: 'Webhook no encontrado' });
        return;
      }

      res.json({ webhook });

    } catch (error) {
      this.handleError(error, res);
    }
  };

  getWebhookStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await WebhookLogModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } },
            successful: {
              $sum: {
                $cond: [
                  { $and: ['$processed', '$processingResult.success'] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            total: 1,
            processed: 1,
            successful: 1,
            pending: { $subtract: ['$total', '$processed'] },
            failed: { $subtract: ['$processed', '$successful'] }
          }
        }
      ]);

      const bySource = await WebhookLogModel.aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } }
          }
        }
      ]);

      const byEventType = await WebhookLogModel.aggregate([
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            processed: { $sum: { $cond: ['$processed', 1, 0] } }
          }
        }
      ]);

      res.json({
        general: stats[0] || { total: 0, processed: 0, successful: 0, pending: 0, failed: 0 },
        bySource,
        byEventType
      });

    } catch (error) {
      this.handleError(error, res);
    }
  };

  getMercadoPagoDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // 1. Buscar el webhook capturado
      const webhook = await WebhookLogModel.findById(id);
      if (!webhook) {
        res.status(404).json({ error: 'Webhook no encontrado' });
        return;
      }

      this.logger.info(`🔍 Obteniendo detalles de MercadoPago para webhook: ${id}`);

      // 2. Extraer el payment_id del webhook según diferentes formatos
      let paymentId: string | null = null;
      let merchantOrderId: string | null = null;

      if (webhook.eventType === 'payment') {
        // Formato 1: Query parameters (?id=PAYMENT_ID&topic=payment)
        if (webhook.queryParams?.id) {
          paymentId = webhook.queryParams.id as string;
        }
        // Formato 2: Query data.id (?data.id=PAYMENT_ID&type=payment)
        else if (webhook.queryParams?.['data.id']) {
          paymentId = webhook.queryParams['data.id'] as string;
        }
        // Formato 3: Body con data.id
        else if (webhook.body?.data?.id) {
          paymentId = webhook.body.data.id as string;
        }
        // Formato 4: Body resource directo
        else if (webhook.body?.resource && typeof webhook.body.resource === 'string') {
          paymentId = webhook.body.resource;
        }
      } else if (webhook.eventType === 'merchant_order') {
        // Merchant Order ID
        if (webhook.queryParams?.id) {
          merchantOrderId = webhook.queryParams.id as string;
        }
        // Extraer del resource URL
        else if (webhook.body?.resource) {
          const match = webhook.body.resource.match(/merchant_orders\/(\d+)/);
          if (match) {
            merchantOrderId = match[1];
          }
        }
      }

      const response: any = {
        webhook: {
          id: webhook._id,
          eventType: webhook.eventType,
          processed: webhook.processed,
          processingResult: webhook.processingResult,
          createdAt: webhook.createdAt,
          ipAddress: webhook.ipAddress,
          userAgent: webhook.userAgent
        },
        mercadoPagoData: null,
        analysis: null,
        traceability: {
          paymentId,
          merchantOrderId,
          webhookFormat: webhook.eventType === 'payment' ?
            (webhook.queryParams?.id ? 'query_id' :
              webhook.queryParams?.['data.id'] ? 'query_data_id' :
                webhook.body?.data?.id ? 'body_data_id' : 'unknown') : 'merchant_order'
        }
      };      // 3. Consultar información COMPLETA de Payment en MercadoPago
      if (paymentId) {
        try {
          this.logger.info(`📊 Consultando payment ${paymentId} en MercadoPago (información completa)`);

          // Usar directamente el adapter para obtener toda la información
          const mpPaymentComplete = await this.mercadoPagoAdapter.getPayment(paymentId);

          response.mercadoPagoData = {
            // ===== INFORMACIÓN BÁSICA DEL PAGO =====
            id: mpPaymentComplete.id,
            status: mpPaymentComplete.status,
            status_detail: mpPaymentComplete.status_detail,
            transaction_amount: mpPaymentComplete.transaction_amount,
            transaction_amount_refunded: mpPaymentComplete.transaction_amount_refunded,
            coupon_amount: mpPaymentComplete.coupon_amount,
            currency_id: mpPaymentComplete.currency_id,

            // ===== TRAZABILIDAD Y REFERENCIAS CRÍTICAS =====
            external_reference: mpPaymentComplete.external_reference,
            description: mpPaymentComplete.description,
            statement_descriptor: mpPaymentComplete.statement_descriptor,

            // ===== INFORMACIÓN DEL MÉTODO DE PAGO =====
            payment_method_id: mpPaymentComplete.payment_method_id,
            payment_type_id: mpPaymentComplete.payment_type_id,
            operation_type: mpPaymentComplete.operation_type,
            installments: mpPaymentComplete.installments,

            // ===== FECHAS IMPORTANTES =====
            date_created: mpPaymentComplete.date_created,
            date_approved: mpPaymentComplete.date_approved,
            date_last_updated: mpPaymentComplete.date_last_updated,
            money_release_date: mpPaymentComplete.money_release_date,

            // ===== INFORMACIÓN DEL PAGADOR =====
            payer: {
              id: mpPaymentComplete.payer?.id,
              email: mpPaymentComplete.payer?.email,
              name: mpPaymentComplete.payer?.name,
              surname: mpPaymentComplete.payer?.surname,
              identification: mpPaymentComplete.payer?.identification,
              phone: mpPaymentComplete.payer?.phone,
              address: mpPaymentComplete.payer?.address
            },

            // ===== DETALLES DE LA TRANSACCIÓN =====
            transaction_details: {
              net_received_amount: mpPaymentComplete.transaction_details?.net_received_amount,
              total_paid_amount: mpPaymentComplete.transaction_details?.total_paid_amount,
              overpaid_amount: mpPaymentComplete.transaction_details?.overpaid_amount,
              installment_amount: mpPaymentComplete.transaction_details?.installment_amount
            },

            // ===== DETALLES DE COMISIONES =====
            fee_details: mpPaymentComplete.fee_details,

            // ===== INFORMACIÓN DE LA TARJETA (SI APLICA) =====
            card: mpPaymentComplete.card ? {
              id: mpPaymentComplete.card.id,
              first_six_digits: mpPaymentComplete.card.first_six_digits,
              last_four_digits: mpPaymentComplete.card.last_four_digits,
              expiration_month: mpPaymentComplete.card.expiration_month,
              expiration_year: mpPaymentComplete.card.expiration_year,
              cardholder: {
                name: mpPaymentComplete.card.cardholder?.name,
                identification: mpPaymentComplete.card.cardholder?.identification
              }
            } : null,

            // ===== IDENTIFICADORES ÚNICOS =====
            collector_id: mpPaymentComplete.collector_id,

            // ===== METADATA COMPLETA Y INFORMACIÓN ADICIONAL =====
            metadata: mpPaymentComplete.metadata,
            additional_info: mpPaymentComplete.additional_info
          };

          // 4. Análisis expandido con TODA la información relevante
          response.analysis = {
            // Montos y cálculos
            realAmount: mpPaymentComplete.transaction_amount,
            netAmount: mpPaymentComplete.transaction_details?.net_received_amount || mpPaymentComplete.transaction_amount,
            mpFees: mpPaymentComplete.fee_details?.reduce((total, fee) => total + fee.amount, 0) || 0,
            refundedAmount: mpPaymentComplete.transaction_amount_refunded,
            couponDiscount: mpPaymentComplete.coupon_amount,

            // Estado del pago
            paymentMethod: `${mpPaymentComplete.payment_method_id} (${mpPaymentComplete.payment_type_id})`,
            installments: mpPaymentComplete.installments,
            approvedAt: mpPaymentComplete.date_approved,
            isApproved: mpPaymentComplete.status === 'approved',

            // ===== CLAVE DE IDEMPOTENCIA ROBUSTA =====
            idempotencyKey: `mp_${mpPaymentComplete.id}_${mpPaymentComplete.external_reference}_${mpPaymentComplete.date_created?.split('T')[0]}`,

            // ===== INFORMACIÓN CRÍTICA PARA VINCULAR CON TU VENTA =====
            linkToSale: {
              externalReference: mpPaymentComplete.external_reference,
              description: mpPaymentComplete.description,
              statementDescriptor: mpPaymentComplete.statement_descriptor,
              suggestedOrderId: mpPaymentComplete.external_reference?.replace(/[^0-9]/g, ''),
              paymentTimestamp: mpPaymentComplete.date_created,
              approvalTimestamp: mpPaymentComplete.date_approved,

              // Items (si están en additional_info)
              items: mpPaymentComplete.additional_info?.items || [],

              // Información del comprador para matching
              buyerInfo: {
                email: mpPaymentComplete.payer?.email,
                identification: mpPaymentComplete.payer?.identification?.number,
                name: `${mpPaymentComplete.payer?.name} ${mpPaymentComplete.payer?.surname}`.trim()
              }
            },
            // Información de seguridad
            riskLevel: this.calculateRiskLevel(mpPaymentComplete),
            trustScore: this.calculateTrustScore(mpPaymentComplete)
          };

          this.logger.info(`✅ Información de pago obtenida exitosamente:`, {
            paymentId: mpPaymentComplete.id,
            status: mpPaymentComplete.status,
            amount: mpPaymentComplete.transaction_amount,
            external_reference: mpPaymentComplete.external_reference
          });

        } catch (mpError) {
          this.logger.error(`❌ Error consultando payment ${paymentId} en MercadoPago:`, mpError);
          response.mercadoPagoData = {
            error: 'No se pudo obtener información del pago desde MercadoPago',
            errorDetail: mpError instanceof Error ? mpError.message : String(mpError),
            paymentId
          };
        }
      }

      // 5. Consultar Merchant Order si aplica
      if (merchantOrderId) {
        try {
          this.logger.info(`📦 Consultando merchant order ${merchantOrderId} en MercadoPago`);

          // Nota: Implementar getMerchantOrder en el paymentService si no existe
          // const mpOrder = await this.paymentService.getMerchantOrder(merchantOrderId);

          response.merchantOrderData = {
            id: merchantOrderId,
            note: 'Merchant Order details - implementar getMerchantOrder en paymentService'
          };

        } catch (moError) {
          this.logger.error(`❌ Error consultando merchant order ${merchantOrderId}:`, moError);
          response.merchantOrderData = {
            error: 'No se pudo obtener información de la orden',
            merchantOrderId
          };
        }
      }

      // 6. Información de trazabilidad adicional
      response.traceability = {
        ...response.traceability,
        webhookIpAddresses: [webhook.ipAddress],
        webhookUserAgent: webhook.userAgent,
        webhookSignature: webhook.headers?.['x-signature'],
        webhookRequestId: webhook.headers?.['x-request-id'],
        possibleDuplicates: await WebhookLogModel.countDocuments({
          $or: [
            ...(paymentId ? [
              { 'queryParams.id': paymentId },
              { 'queryParams.data.id': paymentId },
              { 'body.data.id': paymentId }
            ] : []),
            ...(merchantOrderId ? [
              { 'queryParams.id': merchantOrderId }
            ] : [])
          ],
          _id: { $ne: webhook._id }
        })
      };

      res.json(response);

    } catch (error) {
      this.logger.error('❌ Error obteniendo detalles de MercadoPago:', error);
      this.handleError(error, res);
    }
  };

  /**
   * Calcula el nivel de riesgo del pago basado en varios factores
   */
  private calculateRiskLevel(payment: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;

    // Factor 1: Estado del pago
    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      riskScore += 3;
    } else if (payment.status === 'pending' || payment.status === 'in_process') {
      riskScore += 1;
    }

    // Factor 2: Monto de la transacción
    if (payment.transaction_amount > 100000) { // Montos altos
      riskScore += 2;
    } else if (payment.transaction_amount > 50000) {
      riskScore += 1;
    }

    // Factor 3: Método de pago
    if (payment.payment_method_id === 'rapipago' || payment.payment_method_id === 'pagofacil') {
      riskScore += 1; // Efectivo tiene menos trazabilidad
    }

    // Factor 4: Tiempo entre creación y aprobación
    if (payment.date_created && payment.date_approved) {
      const diffMs = new Date(payment.date_approved).getTime() - new Date(payment.date_created).getTime();
      const diffMinutes = diffMs / (1000 * 60);
      if (diffMinutes > 60) { // Más de 1 hora
        riskScore += 1;
      }
    }

    // Determinar nivel de riesgo
    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calcula un puntaje de confianza del pago (0-100)
   */
  private calculateTrustScore(payment: any): number {
    let score = 50; // Base score

    // Factor positivo: Pago aprobado
    if (payment.status === 'approved') {
      score += 30;
    }

    // Factor positivo: Tiene external_reference
    if (payment.external_reference) {
      score += 10;
    }

    // Factor positivo: Información completa del pagador
    if (payment.payer?.email && payment.payer?.identification?.number) {
      score += 10;
    }

    // Factor positivo: Método de pago confiable
    if (payment.payment_type_id === 'credit_card' || payment.payment_type_id === 'debit_card') {
      score += 5;
    }

    // Factor negativo: Pago rechazado
    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      score -= 40;
    }

    // Factor negativo: Sin información del pagador
    if (!payment.payer?.email) {
      score -= 10;
    }

    // Limitar score entre 0 y 100
    return Math.max(0, Math.min(100, score));
  }
}
