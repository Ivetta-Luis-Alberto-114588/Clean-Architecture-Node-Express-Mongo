// src/presentation/payment/controller.payment.ts

// <<<--- AÑADIR IMPORTACIONES --- >>>
import { Request, Response } from "express"; // Importar tipos de Express
import { CustomError } from "../../domain/errors/custom.error";
import { PaymentRepository } from "../../domain/repositories/payment/payment.repository";
import { OrderRepository } from "../../domain/repositories/order/order.repository";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository";
import { OrderStatusRepository } from "../../domain/repositories/order/order-status.repository";
import { CreatePaymentDto } from "../../domain/dtos/payment/create-payment.dto";
import { ProcessWebhookDto } from "../../domain/dtos/payment/process-webhook.dto";
import { UpdatePaymentStatusDto } from "../../domain/dtos/payment/update-payment-status.dto";
import { VerifyPaymentDto } from "../../domain/dtos/payment/verify-payment.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { CreatePaymentUseCase } from "../../domain/use-cases/payment/create-payment.use-case";
import { GetPaymentUseCase } from "../../domain/use-cases/payment/get-payment.use-case";
import { VerifyPaymentUseCase } from "../../domain/use-cases/payment/verify-payment.use-case";
import { ProcessWebhookUseCase } from "../../domain/use-cases/payment/process-webhook.use-case";
import { GetPaymentByOrderUseCase } from "../../domain/use-cases/payment/get-payment-by-order.use-case";
import { GetAllPaymentsUseCase } from "../../domain/use-cases/payment/get-all-payments.use-case";
import { PaymentEntity, PaymentProvider } from "../../domain/entities/payment/payment.entity"; // Importar PaymentEntity y PaymentProvider
import { MercadoPagoItem, MercadoPagoPayer, MercadoPagoPayment, MercadoPagoPaymentStatus } from "../../domain/interfaces/payment/mercado-pago.interface"; // Importar interfaces de MP
import { IPaymentService } from "../../domain/interfaces/payment.service";
import { ILogger } from "../../domain/interfaces/logger.interface";
import { NotificationService } from "../../domain/interfaces/services/notification.service";
import { envs } from "../../configs/envs";
import { PaymentModel } from "../../data/mongodb/models/payment/payment.model";
import { WebhookLogModel } from "../../data/mongodb/models/webhook/webhook-log.model";
import { v4 as uuidv4 } from 'uuid';
// <<<--- FIN IMPORTACIONES --- >>>

export class PaymentController {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly orderStatusRepository: OrderStatusRepository,
    private readonly paymentService: IPaymentService,
    private readonly logger: ILogger,
    private readonly notificationService?: NotificationService
  ) { }
  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    this.logger.error("Error en PaymentController:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ error: "Error interno del servidor" });
  };

  // Método original
  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.params;
      const host = `${req.protocol}://${req.get('host')}`;

      const sale = await this.orderRepository.findById(saleId);
      if (!sale) {
        res.status(404).json({ error: `Venta con ID ${saleId} no encontrada` });
        return;
      }

      const customer = sale.customer;
      if (!customer) {
        throw CustomError.internalServerError(`No se pudo encontrar el cliente asociado al pedido ${saleId}`);
      }

      const items: MercadoPagoItem[] = sale.items.map(item => ({
        id: item.product.id.toString(),
        title: item.product.name,
        description: item.product.description || 'Sin descripción',
        picture_url: item.product.imgUrl || '',
        category_id: item.product.category.id.toString(),
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'ARS'
      }));

      const payer: MercadoPagoPayer = {
        name: customer.name.split(' ')[0] || customer.name,
        surname: customer.name.split(' ').slice(1).join(' ') || '',
        email: customer.email,
        phone: {
          area_code: customer.phone.substring(0, 3) || '000',
          number: customer.phone.substring(3) || '0000000'
        },
        address: {
          zip_code: '0000',
          street_name: customer.address.split(' ').slice(0, -1).join(' ') || customer.address,
          street_number: parseInt(customer.address.split(' ').pop() || '0') || 0
        }
      };

      const idempotencyKey = `payment-${saleId}-${Date.now()}`;

      const createPaymentDtoData = {
        saleId: saleId,
        customerId: customer.id.toString(),
        amount: sale.total,
        provider: PaymentProvider.MERCADO_PAGO,
        items,
        payer,
        backUrls: {
          success: `${envs.FRONTEND_URL}/payment/success?saleId=${saleId}`, // Usar URL del frontend
          failure: `${envs.FRONTEND_URL}/payment/failure?saleId=${saleId}`,
          pending: `${envs.FRONTEND_URL}/payment/pending?saleId=${saleId}`
        },
        notificationUrl: `${envs.URL_RESPONSE_WEBHOOK_NGROK}api/payments/webhook`,
        idempotencyKey
      };

      const [error, createPaymentDto] = CreatePaymentDto.create(createPaymentDtoData);

      if (error) {
        res.status(400).json({ error });
        return;
      }

      const createPaymentUseCase = new CreatePaymentUseCase(
        this.paymentRepository,
        this.customerRepository,
        this.orderRepository
      );

      const result = await createPaymentUseCase.execute(createPaymentDto!);

      res.json({
        payment: result.payment,
        preference: {
          id: result.preference.id,
          init_point: result.preference.init_point,
          sandbox_init_point: result.preference.sandbox_init_point
        }
      });
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };

  // Nuevo método usando preferencePrueba
  createPaymentPrueba = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.params;
      const host = `${req.protocol}://${req.get('host')}`;

      const sale = await this.orderRepository.findById(saleId);
      if (!sale) {
        res.status(404).json({ error: `Venta con ID ${saleId} no encontrada` });
        return;
      }

      // Verificar si ya existe un pago pendiente para esta venta
      const existingPayment = await PaymentModel.findOne({
        saleId: saleId,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingPayment) {
        this.logger.warn(`Ya existe un pago ${existingPayment.status} para la venta ${saleId}`, {
          existingPaymentId: existingPayment._id,
          status: existingPayment.status
        });
        res.status(409).json({
          error: `Ya existe un pago ${existingPayment.status} para esta venta`,
          code: "PAYMENT_ALREADY_EXISTS",
          existingPayment: {
            id: existingPayment._id,
            status: existingPayment.status,
            preferenceId: existingPayment.preferenceId
          }
        });
        return;
      }

      // <<<--- Crear variable separada en lugar de reasignar req.body --- >>>
      const preferenceBody = {
        items: [
          {
            id: saleId,
            title: `Compra #${saleId.substring(0, 8)}`,
            quantity: 1,
            unit_price: sale.total
          }
        ]
      };

      // Usar el servicio de pagos abstracted
      const paymentPreference = {
        items: [{
          id: saleId,
          title: `Compra #${saleId.substring(0, 8)}`,
          quantity: 1,
          unitPrice: sale.total
        }],
        backUrls: {
          failure: "/failure",
          pending: "/pending",
          success: "/success"
        },
        notificationUrl: "https://5wl9804f-3000.brs.devtunnels.ms/webHook",
        autoReturn: "approved" as const,
        statementDescriptor: "Negocio startUp",
        metadata: { uuid: uuidv4() }
      };

      const preference = await this.paymentService.createPreference(paymentPreference); const newPayment = await PaymentModel.create({
        saleId: saleId,
        customerId: sale.customer.id.toString(),
        amount: sale.total,
        provider: PaymentProvider.MERCADO_PAGO,
        status: 'pending',
        externalReference: `sale-${saleId}-${uuidv4()}`, // Usar UUID para garantizar unicidad
        providerPaymentId: '',
        preferenceId: preference.id,
        paymentMethod: 'other',
        idempotencyKey: `payment-${saleId}-${Date.now()}`,
        metadata: {
          createPaymentDto: preferenceBody, // Guardar el body usado
          preferenceResponse: preference
        }
      });

      const populatedPayment = await PaymentModel.findById(newPayment._id)
        .populate({
          path: 'saleId',
          populate: {
            path: 'customer',
            populate: {
              path: 'neighborhood',
              populate: {
                path: 'city'
              }
            }
          }
        })
        .populate({
          path: 'customerId',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        }); res.json({
          payment: populatedPayment, preference: {
            id: preference.id,
            init_point: preference.initPoint,
            sandbox_init_point: preference.sandboxInitPoint
          }
        });
    } catch (error: any) {
      // Manejo específico de errores de MongoDB
      if (error.code === 11000) {
        if (error.keyPattern?.externalReference) {
          this.logger.error(`Error de clave duplicada en externalReference para saleId: ${req.params.saleId}`, error);
          res.status(409).json({
            error: "Ya existe un pago en proceso para esta venta. Por favor, verifica el estado del pago existente.",
            code: "DUPLICATE_EXTERNAL_REFERENCE"
          });
          return;
        }
        if (error.keyPattern?.preferenceId) {
          this.logger.error(`Error de clave duplicada en preferenceId para saleId: ${req.params.saleId}`, error);
          res.status(409).json({
            error: "Error en la creación de la preferencia de pago. Por favor, intenta nuevamente.",
            code: "DUPLICATE_PREFERENCE_ID"
          });
          return;
        }
      }

      // Para otros errores, usar el manejo general
      this.handleError(error, res);
    }
  };

  getPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const getPaymentUseCase = new GetPaymentUseCase(this.paymentRepository);
      const payment = await getPaymentUseCase.execute(id);

      res.json(payment);
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };

  getPaymentsBySale = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const [error, paginationDto] = PaginationDto.create(
        Number(page),
        Number(limit)
      );

      if (error) {
        res.status(400).json({ error });
        return;
      }

      const getPaymentByOrderUseCase = new GetPaymentByOrderUseCase(
        this.paymentRepository,
        this.orderRepository
      );

      const payments = await getPaymentByOrderUseCase.execute(saleId, paginationDto!);

      res.json(payments);
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };

  getAllPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const [error, paginationDto] = PaginationDto.create(
        Number(page),
        Number(limit)
      );

      if (error) {
        res.status(400).json({ error });
        return;
      }

      const getAllPaymentsUseCase = new GetAllPaymentsUseCase(this.paymentRepository);
      const payments = await getAllPaymentsUseCase.execute(paginationDto!);

      res.json(payments);
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };

  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      // <<<--- Corregir desestructuración de req.body --- >>>
      const { paymentId, providerPaymentId } = req.body; // Asumir que vienen así

      const [error, verifyPaymentDto] = VerifyPaymentDto.create({
        paymentId,
        providerPaymentId
      });

      if (error) {
        res.status(400).json({ error });
        return;
      }

      const verifyPaymentUseCase = new VerifyPaymentUseCase(
        this.paymentRepository,
        this.orderRepository
      );

      const result = await verifyPaymentUseCase.execute(verifyPaymentDto!);

      res.json(result);
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };


  verifyPreferenceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { preferenceId } = req.params;

      if (!preferenceId) {
        res.status(400).json({ error: "El ID de preferencia es requerido" });
        return;
      }

      const payment = await this.paymentRepository.getPaymentByPreferenceId(preferenceId);

      if (!payment) {
        res.status(404).json({ error: `No se encontró ningún pago con preferenceId: ${preferenceId}` });
        return;
      } const preferenceInfo = await this.paymentService.getPreference(preferenceId);

      let paymentInfo = null;
      if (payment.providerPaymentId) {
        paymentInfo = await this.paymentService.getPayment(payment.providerPaymentId);
      }

      res.json({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          externalReference: payment.externalReference,
          providerPaymentId: payment.providerPaymentId,
          amount: payment.amount,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        },
        preferenceInfo: {
          id: preferenceInfo.id,
          status: paymentInfo ? paymentInfo.status : 'unknown',
          isPaid: paymentInfo ? paymentInfo.status === 'approved' : false,
          paymentMethod: paymentInfo ? paymentInfo.payment_method_id : null,
          paymentDate: paymentInfo ? paymentInfo.date_approved : null
        }
      });
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };


  processWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // El middleware ya capturó los datos crudos
      this.logger.info('🎯 Webhook recibido y datos crudos guardados:', {
        webhookLogId: (req as any).webhookLogId,
        query: req.query,
        body: req.body,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-signature': req.headers['x-signature'], // Importante para MP
          'x-request-id': req.headers['x-request-id'] // Importante para MP
        }
      });

      let paymentId;

      if (req.query.id && req.query.topic) {
        const topic = req.query.topic as string;
        paymentId = req.query.id as string;
        this.logger.info(`📝 Webhook formato query: topic=${topic}, paymentId=${paymentId}`);
        if (topic !== 'payment') {
          this.logger.info(`⏭️ Ignorando notificación de tipo: ${topic}`);

          // Actualizar el log con el resultado
          await this.updateWebhookLog((req as any).webhookLogId, {
            success: true,
            error: `Ignorado - topic no relevante: ${topic}`
          });

          res.status(200).json({ message: 'Notificación recibida pero ignorada (topic no relevante)' });
          return;
        }
      }
      else if (req.body.data && req.body.type) {
        const type = req.body.type as string;
        paymentId = req.body.data.id as string;
        this.logger.info(`📝 Webhook formato body: type=${type}, paymentId=${paymentId}`);
        if (type !== 'payment') {
          this.logger.info(`⏭️ Ignorando notificación de tipo: ${type}`);

          // Actualizar el log con el resultado
          await this.updateWebhookLog((req as any).webhookLogId, {
            success: true,
            error: `Ignorado - type no relevante: ${type}`
          });

          res.status(200).json({ message: 'Notificación recibida pero ignorada (type no relevante)' });
          return;
        }
      } else {
        this.logger.error('❌ Formato de notificación no reconocido:', { query: req.query, body: req.body });

        // Actualizar el log con el error
        await this.updateWebhookLog((req as any).webhookLogId, {
          success: false,
          error: 'Formato de notificación no reconocido'
        });

        res.status(400).json({ message: 'Formato de notificación no reconocido' });
        return;
      }

      if (!paymentId) {
        this.logger.error('❌ ID de pago no encontrado en la notificación');

        // Actualizar el log con el error
        await this.updateWebhookLog((req as any).webhookLogId, {
          success: false,
          error: 'ID de pago no encontrado en la notificación'
        });

        res.status(400).json({ message: 'ID de pago no encontrado en la notificación' });
        return;
      }

      this.logger.info(`🔍 Consultando pago en MercadoPago: ${paymentId}`);
      const paymentInfo = await this.paymentService.getPayment(paymentId);
      this.logger.info(`📊 Información del pago MP:`, {
        id: paymentInfo.id,
        status: paymentInfo.status,
        external_reference: paymentInfo.externalReference,
        transaction_amount: paymentInfo.transactionAmount
      });

      const payment = await this.paymentRepository.getPaymentByExternalReference(
        paymentInfo.externalReference
      );

      if (!payment) {
        this.logger.warn(`⚠️ Pago no encontrado en DB para external_reference: ${paymentInfo.externalReference}`);

        // Actualizar el log
        await this.updateWebhookLog((req as any).webhookLogId, {
          success: true,
          error: `Pago no encontrado en DB para external_reference: ${paymentInfo.externalReference}`,
          paymentId: paymentInfo.id
        });

        res.status(200).json({ message: 'Pago no encontrado en DB, notificación ignorada.' });
        return;
      }

      this.logger.info(`✅ Pago encontrado en DB:`, {
        id: payment.id,
        saleId: payment.saleId,
        currentStatus: payment.status,
        amount: payment.amount
      });

      // Verificar idempotencia para evitar procesamiento duplicado
      if (payment.status === paymentInfo.status && payment.providerPaymentId === paymentInfo.id.toString()) {
        this.logger.info(`🔄 Webhook duplicado ignorado: pago ya procesado con el mismo estado`);

        // Actualizar el log
        await this.updateWebhookLog((req as any).webhookLogId, {
          success: true,
          error: 'Webhook duplicado - pago ya procesado',
          paymentId: payment.id,
          orderId: payment.saleId
        });

        res.status(200).json({
          message: 'Webhook duplicado - pago ya procesado',
          paymentStatus: paymentInfo.status
        });
        return;
      }

      const [dtoError, updatePaymentStatusDto] = UpdatePaymentStatusDto.create({
        paymentId: payment.id,
        status: paymentInfo.status,
        providerPaymentId: paymentInfo.id.toString(),
        metadata: paymentInfo
      });

      if (dtoError) {
        this.logger.error('❌ Error creando DTO para actualizar estado', { error: dtoError });

        // Actualizar el log con el error
        await this.updateWebhookLog((req as any).webhookLogId, {
          success: false,
          error: `Error creando DTO: ${dtoError}`,
          paymentId: payment.id,
          orderId: payment.saleId
        });

        res.status(200).json({ status: 'error', message: `Error interno al procesar DTO: ${dtoError}` });
        return;
      }

      this.logger.info(`🔄 Actualizando estado del pago de '${payment.status}' a '${paymentInfo.status}'`);
      const updatedPayment = await this.paymentRepository.updatePaymentStatus(updatePaymentStatusDto!);

      if (paymentInfo.status === 'approved') {
        this.logger.info(`💰 Pago aprobado, actualizando estado de la orden ${payment.saleId}`);

        // SOLUCIÓN TRANSPARENTE: Buscar dinámicamente con fallback seguro
        let targetStatusId: string;
        let statusSource: string;

        try {
          // 1. Intentar buscar por código dinámicamente
          const paidStatus = await this.orderStatusRepository.findByCode('PENDIENTE PAGADO');
          if (paidStatus) {
            targetStatusId = paidStatus.id;
            statusSource = 'dinámico por código';
            this.logger.info(`✅ Estado encontrado dinámicamente: ${paidStatus.name} (${targetStatusId})`);
          } else {
            // 2. Si no existe, usar el hardcoded PERO con warning
            targetStatusId = '675a1a39dd398aae92ab05f8';
            statusSource = 'fallback hardcodeado (DEBE CORREGIRSE)';
            this.logger.warn(`⚠️ Estado 'PENDIENTE PAGADO' no encontrado por código, usando fallback: ${targetStatusId}`);
          }
        } catch (statusError) {
          // 3. Si hay cualquier error, usar fallback
          targetStatusId = '675a1a39dd398aae92ab05f8';
          statusSource = 'fallback por error crítico';
          this.logger.error(`❌ Error crítico buscando estado, usando fallback: ${targetStatusId}`, { 
            error: statusError instanceof Error ? statusError.message : String(statusError),
            stack: statusError instanceof Error ? statusError.stack : undefined
          });
        }

        try {
          this.logger.info(`🎯 Actualizando orden ${payment.saleId} a estado ${targetStatusId} (${statusSource})`);

          await this.orderRepository.updateStatus(payment.saleId, {
            statusId: targetStatusId,
            notes: `Pago aprobado con ID ${paymentInfo.id} (webhook-${statusSource})`
          });

          this.logger.info(`🎉 ÉXITO: Orden ${payment.saleId} actualizada a PENDIENTE PAGADO (${statusSource})`);

          // 🚀 ENVIAR NOTIFICACIÓN DE TELEGRAM CUANDO EL PAGO ES APROBADO
          try {
            this.logger.info(`🔍 [TELEGRAM DEBUG] Iniciando envío de notificación para orden ${payment.saleId}`);
            
            // Verificar que el servicio de notificaciones esté disponible
            if (!this.notificationService) {
              this.logger.error(`❌ [TELEGRAM DEBUG] notificationService es null/undefined`);
              throw new Error('NotificationService no está disponible');
            }
            
            this.logger.info(`✅ [TELEGRAM DEBUG] notificationService está disponible`);
            
            // Obtener la orden completa con todos los datos necesarios
            const order = await this.orderRepository.findById(payment.saleId);
            
            if (!order) {
              this.logger.error(`❌ [TELEGRAM DEBUG] No se pudo encontrar la orden ${payment.saleId}`);
              throw new Error(`Orden ${payment.saleId} no encontrada`);
            }
            
            this.logger.info(`✅ [TELEGRAM DEBUG] Orden encontrada: ${order.id}, Cliente: ${order.customer?.name}`);
            
            const notificationData = {
              orderId: order.id,
              customerName: order.customer?.name || 'Cliente',
              total: order.total,
              items: order.items?.map(item => ({
                name: item.product?.name || 'Producto',
                quantity: item.quantity,
                price: item.unitPrice
              })) || []
            };
            
            this.logger.info(`� [TELEGRAM DEBUG] Enviando notificación con datos:`, {
              orderId: notificationData.orderId,
              customerName: notificationData.customerName,
              total: notificationData.total,
              itemsCount: notificationData.items.length
            });
            
            await this.notificationService.sendOrderNotification(notificationData);
            
            this.logger.info(`✅ [TELEGRAM DEBUG] Notificación de Telegram enviada exitosamente para orden ${payment.saleId}`);
            
          } catch (notificationError) {
            this.logger.error(`❌ [TELEGRAM DEBUG] Error crítico enviando notificación de Telegram para orden ${payment.saleId}:`, {
              error: notificationError instanceof Error ? notificationError.message : String(notificationError),
              stack: notificationError instanceof Error ? notificationError.stack : undefined,
              errorType: notificationError?.constructor?.name
            });
            // No fallar el webhook por un error de notificación, pero log detallado
          }

          // Actualizar el log con éxito
          await this.updateWebhookLog((req as any).webhookLogId, {
            success: true,
            paymentId: payment.id,
            orderId: payment.saleId
          });

        } catch (orderUpdateError) {
          this.logger.error(`❌ ERROR crítico actualizando orden ${payment.saleId}:`, {
            error: orderUpdateError instanceof Error ? orderUpdateError.message : String(orderUpdateError),
            stack: orderUpdateError instanceof Error ? orderUpdateError.stack : undefined,
            targetStatusId,
            statusSource,
            paymentId: payment.id
          });

          // Actualizar el log con el error
          await this.updateWebhookLog((req as any).webhookLogId, {
            success: false,
            error: `Error actualizando orden: ${orderUpdateError instanceof Error ? orderUpdateError.message : String(orderUpdateError)}`,
            paymentId: payment.id,
            orderId: payment.saleId
          });

          // NO fallar el webhook completo, pero registrar el error crítico
          res.status(200).json({
            message: 'Pago actualizado pero error en orden',
            paymentStatus: paymentInfo.status,
            orderError: 'Error actualizando estado de orden',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } else {
        this.logger.info(`ℹ️ Pago no aprobado (${paymentInfo.status}), no se actualiza orden`);

        // Actualizar el log
        await this.updateWebhookLog((req as any).webhookLogId, {
          success: true,
          paymentId: payment.id,
          orderId: payment.saleId
        });
      }

      res.status(200).json({
        message: 'Notificación procesada exitosamente',
        paymentStatus: paymentInfo.status,
        orderUpdated: paymentInfo.status === 'approved',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('💥 Error crítico procesando webhook:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        query: req.query,
        body: req.body
      });

      // Actualizar el log con el error crítico
      await this.updateWebhookLog((req as any).webhookLogId, {
        success: false,
        error: `Error crítico: ${error instanceof Error ? error.message : String(error)}`
      });

      // IMPORTANTE: Siempre devolver 200 a MP para evitar reintentos infinitos
      res.status(200).json({
        status: 'error',
        message: 'Error procesando webhook',
        timestamp: new Date().toISOString()
      });
    }
  };


  paymentSuccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payment_id, external_reference, saleId, status, merchant_order_id } = req.query;

      this.logger.info('🎉 Payment success callback received', {
        payment_id,
        external_reference,
        saleId,
        status,
        merchant_order_id,
        timestamp: new Date().toISOString()
      });

      let verificationResult: {
        verified: boolean;
        realStatus: string;
        localUpdated: boolean;
        error?: string;
      } = {
        verified: false,
        realStatus: 'unknown',
        localUpdated: false
      };

      // 🔥 PASO CRÍTICO: Verificar estado REAL en MercadoPago usando OAuth
      if (payment_id) {
        try {
          this.logger.info(`🔍 Verificando estado real con OAuth para payment: ${payment_id}`);

          // Usar OAuth para verificación más segura
          const realPaymentInfo = await (this.paymentService as any).verifyPaymentWithOAuth(payment_id.toString());

          this.logger.info(`💰 Estado real verificado con OAuth:`, {
            mpPaymentId: realPaymentInfo.id,
            status: realPaymentInfo.status,
            amount: realPaymentInfo.transaction_amount,
            external_reference: realPaymentInfo.external_reference,
            date_approved: realPaymentInfo.date_approved
          });

          verificationResult.verified = true;
          verificationResult.realStatus = realPaymentInfo.status;

          // ✅ Si está REALMENTE aprobado, asegurar que esté actualizado localmente
          if (realPaymentInfo.status === 'approved') {
            const wasUpdated = await this.ensurePaymentIsUpdatedLocallyWithOAuth(
              realPaymentInfo,
              external_reference?.toString() || saleId?.toString()
            );
            verificationResult.localUpdated = wasUpdated;

            this.logger.info(`✅ Pago verificado con OAuth y sincronizado localmente`, {
              paymentId: payment_id,
              wasUpdated,
              realStatus: realPaymentInfo.status
            });
          } else {
            this.logger.warn(`⚠️ Pago redirigido a success pero estado real es: ${realPaymentInfo.status}`, {
              paymentId: payment_id,
              expectedStatus: 'approved',
              realStatus: realPaymentInfo.status
            });
          }

        } catch (verificationError) {
          this.logger.error('❌ Error verificando pago con OAuth en success callback:', verificationError);
          verificationResult.error = verificationError instanceof Error
            ? verificationError.message
            : String(verificationError);

          // NO fallar la redirección, pero alertar para revisión manual
          await this.sendVerificationFailureNotification(payment_id.toString(), verificationError);
        }
      }

      // Determinar saleId para la redirección y agregar parámetros de verificación
      const finalSaleId = saleId || external_reference || '';
      const verificationParams = new URLSearchParams({
        saleId: finalSaleId.toString(),
        verified: verificationResult.verified.toString(),
        realStatus: verificationResult.realStatus,
        localUpdated: verificationResult.localUpdated.toString(),
        oauthVerified: 'true',
        timestamp: new Date().getTime().toString()
      });

      if (verificationResult.error) {
        verificationParams.set('verificationError', 'true');
      }

      const redirectUrl = `${envs.FRONTEND_URL}/payment/success?${verificationParams.toString()}`;

      this.logger.info(`🔄 Redirecting to success page with OAuth verification:`, {
        url: redirectUrl,
        verificationResult
      });

      res.redirect(302, redirectUrl);

    } catch (error) {
      this.logger.error('❌ Error crítico en paymentSuccess:', error);

      // Redirigir a página de error con información
      const errorParams = new URLSearchParams({
        error: 'callback_error',
        message: 'Error procesando verificación de pago',
        timestamp: new Date().getTime().toString()
      });

      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?${errorParams.toString()}`;
      res.redirect(302, redirectUrl);
    }
  };

  // ✅ MÉTODO AUXILIAR para asegurar sincronización con OAuth
  private async ensurePaymentIsUpdatedLocallyWithOAuth(
    mpPaymentInfo: any,
    reference: string | string[]
  ): Promise<boolean> {
    try {
      if (!reference) return false;

      const referenceStr = Array.isArray(reference) ? reference[0] : reference;

      this.logger.info(`🔄 Ensuring local payment is updated with OAuth data for reference: ${referenceStr}`);

      // Buscar pago local por external_reference O por saleId
      let localPayment = await this.paymentRepository.getPaymentByExternalReference(referenceStr);

      if (!localPayment) {
        const paymentsForSale = await this.paymentRepository.getPaymentsBySaleId(referenceStr, { page: 1, limit: 1 });
        localPayment = paymentsForSale?.[0] || null;
      }

      if (localPayment) {
        // Verificar si necesita actualización
        const needsUpdate = localPayment.status !== mpPaymentInfo.status ||
          localPayment.providerPaymentId !== mpPaymentInfo.id.toString();

        if (needsUpdate) {
          this.logger.info(`🔄 Updating local payment with OAuth verification data`);

          // Actualizar estado local con datos OAuth
          await this.paymentRepository.updatePaymentStatus({
            paymentId: localPayment.id,
            status: mpPaymentInfo.status,
            providerPaymentId: mpPaymentInfo.id.toString(),
            metadata: {
              ...localPayment.metadata,
              lastOAuthVerification: new Date(),
              oauthVerificationSource: 'success_callback',
              mpStatusDetail: mpPaymentInfo.status_detail,
              mpDateApproved: mpPaymentInfo.date_approved,
              mpTransactionAmount: mpPaymentInfo.transaction_amount
            }
          });

          // Actualizar orden también si el pago está aprobado
          if (mpPaymentInfo.status === 'approved' && localPayment.saleId) {
            try {
              const completedStatus = await this.orderStatusRepository.findByCode('COMPLETED');
              if (completedStatus) {
                await this.orderRepository.updateStatus(localPayment.saleId, {
                  statusId: completedStatus.id,
                  notes: `Pago verificado con OAuth en success callback - MP ID: ${mpPaymentInfo.id}`
                });

                this.logger.info(`📋 Order ${localPayment.saleId} updated to COMPLETED via OAuth verification`);
              }
            } catch (orderError) {
              this.logger.error('❌ Error updating order status via OAuth:', orderError);
            }
          }

          // Enviar notificación de sincronización exitosa
          await this.sendSuccessfulSyncNotification(localPayment, mpPaymentInfo);

          return true;
        } else {
          this.logger.info(`✅ Local payment already synchronized via OAuth for reference: ${referenceStr}`);
          return false;
        }
      } else {
        this.logger.warn(`⚠️ No local payment found for OAuth verification, reference: ${referenceStr}`);

        // Notificar que no se encontró el pago local
        await this.sendPaymentNotFoundNotification(referenceStr, mpPaymentInfo);
        return false;
      }

    } catch (error) {
      this.logger.error('❌ Error ensuring local payment update with OAuth:', error);
      return false;
    }
  }

  // Método para enviar notificación de verificación exitosa
  private async sendSuccessfulSyncNotification(localPayment: any, mpPaymentInfo: any): Promise<void> {
    try {
      if (!this.notificationService) return;

      const message = `✅ Pago Sincronizado con OAuth
🆔 Payment ID: ${mpPaymentInfo.id}
📋 Order ID: ${localPayment.saleId}  
📊 Status: ${mpPaymentInfo.status}
💰 Amount: $${mpPaymentInfo.transaction_amount}
🔧 Method: OAuth Success Callback
⏰ Time: ${new Date().toLocaleString('es-ES')}`;

      await this.notificationService.sendMessageToAdmin(message);
    } catch (error) {
      this.logger.error('Error sending successful sync notification:', error);
    }
  }

  // Método para notificar cuando falla la verificación OAuth
  private async sendVerificationFailureNotification(paymentId: string, error: any): Promise<void> {
    try {
      if (!this.notificationService) return;

      const message = `⚠️ Error en Verificación OAuth
🆔 Payment ID: ${paymentId}
❌ Error: ${error instanceof Error ? error.message : String(error)}
📍 Source: Success Callback OAuth Verification
⏰ Time: ${new Date().toLocaleString('es-ES')}
🔧 Action: Revisar manualmente`;

      await this.notificationService.sendMessageToAdmin(message);
    } catch (notificationError) {
      this.logger.error('Error sending verification failure notification:', notificationError);
    }
  }

  // Método para notificar cuando no se encuentra el pago local
  private async sendPaymentNotFoundNotification(reference: string, mpPaymentInfo: any): Promise<void> {
    try {
      if (!this.notificationService) return;

      const message = `🔍 Pago Local No Encontrado
🆔 MP Payment ID: ${mpPaymentInfo.id}
📋 Reference: ${reference}
📊 Status: ${mpPaymentInfo.status}
💰 Amount: $${mpPaymentInfo.transaction_amount}
📍 Source: OAuth Success Callback
🔧 Action: Crear pago local manualmente`;

      await this.notificationService.sendMessageToAdmin(message);
    } catch (error) {
      this.logger.error('Error sending payment not found notification:', error);
    }
  }

  // Método auxiliar para actualizar estado local
  private async updateLocalPaymentStatus(
    mpPaymentInfo: any,
    reference: string | string[],
    source: string
  ): Promise<void> {
    try {
      if (!reference) return;

      const referenceStr = Array.isArray(reference) ? reference[0] : reference;

      let localPayment = await this.paymentRepository.getPaymentByExternalReference(referenceStr);

      if (!localPayment) {
        const paymentsForSale = await this.paymentRepository.getPaymentsBySaleId(referenceStr, { page: 1, limit: 1 });
        localPayment = paymentsForSale?.[0] || null;
      }

      if (localPayment && localPayment.status !== mpPaymentInfo.status) {
        await this.paymentRepository.updatePaymentStatus({
          paymentId: localPayment.id,
          status: mpPaymentInfo.status,
          providerPaymentId: mpPaymentInfo.id.toString(),
          metadata: {
            ...localPayment.metadata,
            lastSync: new Date(),
            syncSource: source
          }
        });

        this.logger.info(`✅ Local payment status updated to ${mpPaymentInfo.status} from ${source}`);
      }

    } catch (error) {
      this.logger.error(`Error updating local payment status from ${source}:`, error);
    }
  }

  paymentFailure = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payment_id, external_reference, saleId } = req.query;

      this.logger.info('❌ Payment failure callback received', {
        payment_id,
        external_reference,
        saleId
      });

      // Verificar estado real para confirmar que falló
      if (payment_id) {
        try {
          const realPaymentInfo = await (this.paymentService as any).verifyPaymentWithOAuth(payment_id.toString());
          this.logger.info(`💔 Payment failed confirmed - MP Status: ${realPaymentInfo.status}`);

          // Actualizar estado local si es necesario
          if (realPaymentInfo.status === 'rejected' || realPaymentInfo.status === 'cancelled') {
            await this.updateLocalPaymentStatus(realPaymentInfo, external_reference?.toString() || saleId?.toString(), 'failure_callback');
          }
        } catch (error) {
          this.logger.error('Error verifying failed payment:', error);
        }
      }

      const finalSaleId = saleId || external_reference || '';
      const redirectUrl = `${envs.FRONTEND_URL}/payment/failure?saleId=${finalSaleId}&verified=true`;
      res.redirect(302, redirectUrl);

    } catch (error) {
      this.logger.error('Error en paymentFailure', { error });
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(302, redirectUrl);
    }
  };

  paymentPending = async (req: Request, res: Response): Promise<void> => {
    try {
      const { payment_id, external_reference, saleId } = req.query;

      this.logger.info('⏳ Payment pending callback received', {
        payment_id,
        external_reference,
        saleId
      });

      // Verificar estado real para confirmar que está pendiente
      if (payment_id) {
        try {
          const realPaymentInfo = await (this.paymentService as any).verifyPaymentWithOAuth(payment_id.toString());
          this.logger.info(`⏳ Payment pending confirmed - MP Status: ${realPaymentInfo.status}`);

          if (realPaymentInfo.status === 'pending' || realPaymentInfo.status === 'in_process') {
            await this.updateLocalPaymentStatus(realPaymentInfo, external_reference?.toString() || saleId?.toString(), 'pending_callback');
          }
        } catch (error) {
          this.logger.error('Error verifying pending payment:', error);
        }
      }

      const finalSaleId = saleId || external_reference || '';
      const redirectUrl = `${envs.FRONTEND_URL}/payment/pending?saleId=${finalSaleId}&verified=true`;
      res.redirect(302, redirectUrl);

    } catch (error) {
      this.logger.error('Error en paymentPending', { error });
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(302, redirectUrl);
    }
  };

  getAllMercadoPagoPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query; const filters: any = {};
      if (status) filters.status = status;
      if (startDate) filters.begin_date = new Date(startDate as string).toISOString(); // Asegurar formato ISO
      if (endDate) filters.end_date = new Date(endDate as string).toISOString(); // Asegurar formato ISO

      const offset = (Number(page) - 1) * Number(limit);

      const searchFilters = {
        status: status as string,
        beginDate: startDate ? new Date(startDate as string).toISOString() : undefined,
        endDate: endDate ? new Date(endDate as string).toISOString() : undefined,
      };

      const paymentsData = await this.paymentService.searchPayments(searchFilters, Number(limit), offset);

      const enhancedPayments = await Promise.all(
        paymentsData.results.map(async (payment) => {
          const localPayment = await this.paymentRepository.getPaymentByProviderPaymentId(
            payment.id.toString()
          );
          return { ...payment, localPaymentInfo: localPayment || null };
        })
      );

      res.json({
        total: paymentsData.paging.total,
        offset: paymentsData.paging.offset,
        limit: paymentsData.paging.limit,
        payments: enhancedPayments
      });
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };


  getAllMercadoPagoCharges = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (startDate) filters.begin_date = new Date(startDate as string).toISOString(); // Asegurar formato ISO
      if (endDate) filters.end_date = new Date(endDate as string).toISOString(); // Asegurar formato ISO      // filters.operation_type = 'regular_payment'; // Descomentar si solo quieres cobros

      const offset = (Number(page) - 1) * Number(limit);

      const searchFilters = {
        status: status as string,
        beginDate: startDate ? new Date(startDate as string).toISOString() : undefined,
        endDate: endDate ? new Date(endDate as string).toISOString() : undefined,
        operationType: 'regular_payment'
      };

      const chargesData = await this.paymentService.searchPayments(searchFilters, Number(limit), offset); const enhancedCharges = await Promise.all(
        chargesData.results.map(async (charge) => {
          const localPayment = await this.paymentRepository.getPaymentByProviderPaymentId(
            charge.id.toString()
          );
          return { ...charge, localPaymentInfo: localPayment || null };
        })
      );

      res.json({
        total: chargesData.paging.total,
        offset: chargesData.paging.offset,
        limit: chargesData.paging.limit,
        charges: enhancedCharges
      });
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
      this.handleError(error, res);
    }
  };

  // NUEVO: Método para verificar y corregir pagos manualmente
  manualPaymentVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;

      this.logger.info(`🔍 Verificación manual iniciada para orden: ${orderId}`);

      // Buscar la orden
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        res.status(404).json({ error: `Orden ${orderId} no encontrada` });
        return;
      }

      // Buscar pagos asociados a esta orden
      const payments = await this.paymentRepository.getPaymentsBySaleId(orderId, { page: 1, limit: 10 });

      if (!payments || payments.length === 0) {
        res.status(404).json({ error: `No se encontraron pagos para la orden ${orderId}` });
        return;
      }

      const results = [];

      for (const payment of payments) {
        if (payment.providerPaymentId && payment.status !== 'approved') {
          try {
            this.logger.info(`🔍 Verificando pago MP: ${payment.providerPaymentId}`);

            // Verificar estado actual en MercadoPago
            const mpPayment = await this.paymentService.getPayment(payment.providerPaymentId);

            if (String(mpPayment.status) === 'approved' && String(payment.status) !== 'approved') {
              this.logger.info(`💰 Pago aprobado encontrado, actualizando...`);

              // Actualizar el pago
              const [error, updateDto] = UpdatePaymentStatusDto.create({
                paymentId: payment.id,
                status: mpPayment.status,
                providerPaymentId: payment.providerPaymentId,
                metadata: mpPayment
              });

              if (!error && updateDto) {
                await this.paymentRepository.updatePaymentStatus(updateDto);

                // Actualizar la orden
                const paidStatus = await this.orderStatusRepository.findByCode('PENDIENTE PAGADO');
                const targetStatusId = paidStatus?.id || '675a1a39dd398aae92ab05f8';

                await this.orderRepository.updateStatus(orderId, {
                  statusId: targetStatusId,
                  notes: `Pago verificado manualmente - ID ${mpPayment.id}`
                });

                results.push({
                  paymentId: payment.id,
                  status: 'corrected',
                  mpStatus: mpPayment.status,
                  orderUpdated: true
                });

                this.logger.info(`✅ Pago ${payment.id} corregido y orden actualizada`);
              }
            } else {
              results.push({
                paymentId: payment.id,
                status: 'no_change_needed',
                currentStatus: payment.status,
                mpStatus: mpPayment.status
              });
            }
          } catch (error) {
            this.logger.error(`❌ Error verificando pago ${payment.id}:`, error);
            results.push({
              paymentId: payment.id,
              status: 'error',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        } else {
          results.push({
            paymentId: payment.id,
            status: 'already_approved_or_no_provider_id',
            currentStatus: payment.status
          });
        }
      }

      res.json({
        orderId,
        orderCurrentStatus: order.status,
        verificationsPerformed: results.length,
        results
      });

    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Endpoint para que el frontend verifique el estado después del callback
  getPaymentStatusBySale = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.params;

      this.logger.info(`🔍 Frontend requesting payment status for sale: ${saleId}`);

      // Buscar pagos para esta venta
      const payments = await this.paymentRepository.getPaymentsBySaleId(saleId, { page: 1, limit: 1 });

      if (!payments || payments.length === 0) {
        res.status(404).json({
          error: 'No se encontraron pagos para esta venta',
          saleId
        });
        return;
      }

      const payment = payments[0];

      // Si tiene providerPaymentId, verificar estado real en MP
      let realStatus = payment.status;
      let lastVerified = null;

      if (payment.providerPaymentId) {
        try {
          const mpPayment = await (this.paymentService as any).verifyPaymentWithOAuth(payment.providerPaymentId);
          realStatus = mpPayment.status;
          lastVerified = new Date();

          // Si el estado cambió, actualizarlo
          if (payment.status !== mpPayment.status) {
            await this.paymentRepository.updatePaymentStatus({
              paymentId: payment.id,
              status: mpPayment.status,
              providerPaymentId: mpPayment.id.toString(),
              metadata: {
                ...payment.metadata,
                lastFrontendVerification: lastVerified
              }
            });
          }
        } catch (mpError) {
          this.logger.error('Error verifying payment status with MP:', mpError);
        }
      }

      res.json({
        success: true,
        payment: {
          id: payment.id,
          status: realStatus,
          amount: payment.amount,
          providerPaymentId: payment.providerPaymentId,
          lastVerified,
          saleId: payment.saleId
        }
      });

    } catch (error) {
      this.handleError(error, res);
    }
  };

  // Método helper para actualizar el log de webhook
  private async updateWebhookLog(webhookLogId: string, result: any): Promise<void> {
    if (!webhookLogId) return;

    try {
      await WebhookLogModel.findByIdAndUpdate(webhookLogId, {
        processed: true,
        processingResult: result
      });
    } catch (error) {
      this.logger.error('Error actualizando log de webhook:', error);
    }
  }
}