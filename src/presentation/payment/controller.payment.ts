// src/presentation/payment/controller.payment.ts

import { Request, Response } from "express";
import { CustomError } from "../../domain/errors/custom.error";
import { PaymentRepository } from "../../domain/repositories/payment/payment.repository";
import { SaleRepository } from "../../domain/repositories/sales/sale.repository";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository";
import { CreatePaymentDto } from "../../domain/dtos/payment/create-payment.dto";
import { ProcessWebhookDto } from "../../domain/dtos/payment/process-webhook.dto";
import { UpdatePaymentStatusDto } from "../../domain/dtos/payment/update-payment-status.dto";
import { VerifyPaymentDto } from "../../domain/dtos/payment/verify-payment.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { CreatePaymentUseCase } from "../../domain/use-cases/payment/create-payment.use-case";
import { GetPaymentUseCase } from "../../domain/use-cases/payment/get-payment.use-case";
import { VerifyPaymentUseCase } from "../../domain/use-cases/payment/verify-payment.use-case";
import { ProcessWebhookUseCase } from "../../domain/use-cases/payment/process-webhook.use-case";
import { GetPaymentBySaleUseCase } from "../../domain/use-cases/payment/get-payment-by-sale.use-case";
import { GetAllPaymentsUseCase } from "../../domain/use-cases/payment/get-all-payments.use-case";
import { PaymentProvider } from "../../domain/entities/payment/payment.entity";
import { MercadoPagoItem, MercadoPagoPayer } from "../../domain/interfaces/payment/mercado-pago.interface";
import { envs } from "../../configs/envs";

export class PaymentController {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly saleRepository: SaleRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    console.log("Error en PaymentController:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  };

  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.params;
      const host = `${req.protocol}://${req.get('host')}`;

      // Obtener la venta
      const sale = await this.saleRepository.findById(saleId);
      if (!sale) {
        res.status(404).json({ error: `Venta con ID ${saleId} no encontrada` });
        return;
      }

      // Crear los items para Mercado Pago
      const items: MercadoPagoItem[] = sale.items.map(item => ({
        id: item.product.id.toString(),
        title: item.product.name,
        description: item.product.description || 'Sin descripción',
        picture_url: item.product.imgUrl || '',
        category_id: item.product.category.id.toString(),
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: 'ARS' // Moneda Argentina por defecto, podría ser parametrizable
      }));

      // Crear la información del pagador
      const payer: MercadoPagoPayer = {
        name: sale.customer.name.split(' ')[0] || '', // Primer nombre
        surname: sale.customer.name.split(' ').slice(1).join(' ') || '', // Apellido
        email: sale.customer.email,
        phone: {
          area_code: sale.customer.phone.substring(0, 3) || '000',
          number: sale.customer.phone.substring(3) || '00000000'
        },
        address: {
          zip_code: '0000', // Podría obtenerse del neighborhood
          street_name: sale.customer.address.split(' ')[0] || '',
          street_number: parseInt(sale.customer.address.split(' ')[1] || '0')
        }
      };

      // Generar clave de idempotencia
      const idempotencyKey = `payment-${saleId}-${Date.now()}`;

      // Crear DTO para el pago
      const createPaymentDtoData = {
        saleId: saleId,
        customerId: sale.customer.id.toString(),
        amount: sale.total,
        provider: PaymentProvider.MERCADO_PAGO,
        items,
        payer,
        backUrls: {
          success: `${host}/api/payments/success?saleId=${saleId}`,
          failure: `${host}/api/payments/failure?saleId=${saleId}`,
          pending: `${host}/api/payments/pending?saleId=${saleId}`
        },
        notificationUrl: `${host}/api/payments/webhook`,
        idempotencyKey
      };

      const [error, createPaymentDto] = CreatePaymentDto.create(createPaymentDtoData);

      if (error) {
        res.status(400).json({ error });
        return;
      }

      // Crear el pago utilizando el caso de uso
      const createPaymentUseCase = new CreatePaymentUseCase(
        this.paymentRepository,
        this.customerRepository,
        this.saleRepository
      );

      const result = await createPaymentUseCase.execute(createPaymentDto!);

      // Responder con los datos necesarios para el frontend
      res.json({
        payment: result.payment,
        preference: {
          id: result.preference.id,
          init_point: result.preference.init_point,
          sandbox_init_point: result.preference.sandbox_init_point
        }
      });
    } catch (error) {
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

      const getPaymentBySaleUseCase = new GetPaymentBySaleUseCase(
        this.paymentRepository,
        this.saleRepository
      );

      const payments = await getPaymentBySaleUseCase.execute(saleId, paginationDto!);

      res.json(payments);
    } catch (error) {
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
      this.handleError(error, res);
    }
  };

  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: paymentId, providerPaymentId } = req.body;

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
        this.saleRepository
      );

      const result = await verifyPaymentUseCase.execute(verifyPaymentDto!);

      res.json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  processWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, topic, type = 'payment' } = req.query;
      const action = req.body.action || 'update';

      console.log('Webhook recibido:', { id, topic, type, action, body: req.body });
      
      // MercadoPago envía los datos de dos formas diferentes según el entorno
      const data = {
        id: id || req.body.data?.id || ''
      };

      const [error, processWebhookDto] = ProcessWebhookDto.create({
        type: type as string,
        action: action,
        data
      });

      if (error) {
        console.log('Error en validación de webhook:', error);
        res.status(400).json({ error });
        return;
      }

      const processWebhookUseCase = new ProcessWebhookUseCase(
        this.paymentRepository,
        this.saleRepository
      );

      // Procesamos el webhook de forma asíncrona para responder rápido a MercadoPago
      processWebhookUseCase.execute(processWebhookDto!)
        .then(result => {
          console.log('Webhook procesado correctamente:', result.id);
        })
        .catch(error => {
          console.error('Error al procesar webhook:', error);
        });

      // Respondemos inmediatamente a MercadoPago para evitar timeouts
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Error en webhook:', error);
      // Siempre respondemos 200 a MercadoPago para evitar reintentos
      res.status(200).json({ status: 'error', message: 'Error procesando webhook' });
    }
  };

  // Endpoints para las redirecciones de MercadoPago
  paymentSuccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId, payment_id, external_reference, status } = req.query;

      console.log('Pago exitoso:', { saleId, payment_id, external_reference, status });

      if (payment_id) {
        // Verificar el pago con MercadoPago
        const [error, verifyPaymentDto] = VerifyPaymentDto.create({
          paymentId: external_reference?.toString() || saleId?.toString() || '',
          providerPaymentId: payment_id.toString()
        });

        if (!error && verifyPaymentDto) {
          const verifyPaymentUseCase = new VerifyPaymentUseCase(
            this.paymentRepository,
            this.saleRepository
          );

          // Verificar el pago de forma asíncrona para no hacer esperar al usuario
          verifyPaymentUseCase.execute(verifyPaymentDto)
            .then(result => {
              console.log('Pago verificado correctamente:', result.payment.id);
            })
            .catch(error => {
              console.error('Error al verificar pago:', error);
            });
        }
      }

      // Redirigir al frontend o mostrar página de éxito
      const redirectUrl = `${envs.FRONTEND_URL}/payment/success?saleId=${saleId}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error en paymentSuccess:', error);
      
      // Redirigir al frontend con error
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(redirectUrl);
    }
  };

  paymentFailure = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.query;
      
      console.log('Pago fallido:', req.query);
      
      // Redirigir al frontend o mostrar página de error
      const redirectUrl = `${envs.FRONTEND_URL}/payment/failure?saleId=${saleId}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error en paymentFailure:', error);
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(redirectUrl);
    }
  };

  paymentPending = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.query;
      
      console.log('Pago pendiente:', req.query);
      
      // Redirigir al frontend o mostrar página de pendiente
      const redirectUrl = `${envs.FRONTEND_URL}/payment/pending?saleId=${saleId}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error en paymentPending:', error);
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(redirectUrl);
    }
  };
}