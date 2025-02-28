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
import { MercadoPagoAdapter } from "../../infrastructure/adapters/mercado-pago.adapter";
import { PaymentModel } from "../../data/mongodb/models/payment/payment.model";
import { v4 as uuidv4 } from 'uuid';

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

  // Método original
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
          // success: `${host}/api/payments/success?saleId=${saleId}`,
          // failure: `${host}/api/payments/failure?saleId=${saleId}`,
          // pending: `${host}/api/payments/pending?saleId=${saleId}`
          success: `/api/payments/success?saleId=${saleId}`,
          failure: `/api/payments/failure?saleId=${saleId}`,
          pending: `/api/payments/pending?saleId=${saleId}`
        },
        // notificationUrl: `${host}/api/payments/webhook`,
        notificationUrl: `https://5wl9804f-3000.brs.devtunnels.ms/api/payments/webhook`,
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

  // Nuevo método usando preferencePrueba
  createPaymentPrueba = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId } = req.params;
      const host = `${req.protocol}://${req.get('host')}`;

      // Obtener la venta
      const sale = await this.saleRepository.findById(saleId);
      if (!sale) {
        res.status(404).json({ error: `Venta con ID ${saleId} no encontrada` });
        return;
      }

      // Preparar datos para la preferencia
      req.body = {
        items: [
          {
            id: saleId,
            title: `Compra #${saleId.substring(0, 8)}`,
            quantity: 1,
            unit_price: sale.total
          }
        ]
      };

      // Obtengo la instancia del adaptador
      const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();

      // Crear la preferencia directamente con el adaptador
      const preference = await mercadoPagoAdapter.preferencePrueba(req);

      // Guardar el pago en la base de datos
      const newPayment = await PaymentModel.create({
        saleId: saleId,
        customerId: sale.customer.id.toString(),
        amount: sale.total,
        provider: PaymentProvider.MERCADO_PAGO,
        status: 'pending',
        externalReference: `sale-${saleId}`,
        providerPaymentId: '',
        preferenceId: preference.id,
        paymentMethod: 'other',
        idempotencyKey: `payment-${saleId}-${Date.now()}`,
        metadata: {
          createPaymentDto: req.body,
          preferenceResponse: preference
        }
      });

      // Cargar las relaciones
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
        });

      // Responder con los datos necesarios para el frontend
      res.json({
        payment: populatedPayment,
        preference: {
          id: preference.id,
          init_point: preference.init_point,
          sandbox_init_point: preference.sandbox_init_point
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


  // verificar el status de una preferencia
  verifyPreferenceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { preferenceId } = req.params;
    
    if (!preferenceId) {
      res.status(400).json({ error: "El ID de preferencia es requerido" });
      return;
    }
    
    // Buscar el pago asociado a esta preferencia en nuestra base de datos
    const payment = await this.paymentRepository.getPaymentByPreferenceId(preferenceId);
    
    if (!payment) {
      res.status(404).json({ error: `No se encontró ningún pago con preferenceId: ${preferenceId}` });
      return;
    }
    
    // Obtener la instancia del adaptador de Mercado Pago
    const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
    
    // Verificar el estado de la preferencia con Mercado Pago
    const preferenceInfo = await mercadoPagoAdapter.getPreference(preferenceId);
    
    // Si hay un paymentId asociado, verificamos el estado del pago
    let paymentInfo = null;
    if (payment.providerPaymentId) {
      paymentInfo = await mercadoPagoAdapter.getPayment(payment.providerPaymentId);
    }
    
    // Devolver la información completa
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
    this.handleError(error, res);
  }
};



processWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Loguea la información completa recibida para depuración
    console.log('Webhook recibido:', { 
      query: req.query, 
      body: req.body,
      headers: req.headers
    });
    
    // Mercado Pago puede enviar notificaciones en diferentes formatos
    // dependiendo del entorno y el tipo de notificación
    let paymentId;
    
    // Formato 1: notificación tipo IPN
    if (req.query.id && req.query.topic) {
      const topic = req.query.topic as string;
      paymentId = req.query.id as string;
      
      if (topic !== 'payment') {
        // Solo procesamos notificaciones de pagos
        console.log(`Ignorando notificación de tipo: ${topic}`);
        res.status(200).json({ message: 'Notificación recibida pero ignorada (topic no relevante)' });
        return;
      }
    } 
    // Formato 2: notificación tipo Webhook
    else if (req.body.data && req.body.type) {
      const type = req.body.type as string;
      paymentId = req.body.data.id as string;
      
      if (type !== 'payment') {
        // Solo procesamos notificaciones de pagos
        console.log(`Ignorando notificación de tipo: ${type}`);
        res.status(200).json({ message: 'Notificación recibida pero ignorada (type no relevante)' });
        return;
      }
    } else {
      // Formato no reconocido
      console.log('Formato de notificación no reconocido');
      res.status(400).json({ message: 'Formato de notificación no reconocido' });
      return;
    }
    
    if (!paymentId) {
      console.log('ID de pago no encontrado en la notificación');
      res.status(400).json({ message: 'ID de pago no encontrado en la notificación' });
      return;
    }
    
    // Obtenemos los detalles del pago desde Mercado Pago
    const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
    const paymentInfo = await mercadoPagoAdapter.getPayment(paymentId);
    
    // Buscamos el pago en nuestra base de datos por externalReference
    const payment = await this.paymentRepository.getPaymentByExternalReference(
      paymentInfo.external_reference
    );
    
    if (!payment) {
      console.log(`Pago no encontrado para external_reference: ${paymentInfo.external_reference}`);
      res.status(404).json({ message: 'Pago no encontrado' });
      return;
    }
    
    // Actualizamos el estado del pago en nuestra base de datos
    const updatePaymentStatusDto = UpdatePaymentStatusDto.create({
      paymentId: payment.id,
      status: paymentInfo.status,
      providerPaymentId: paymentInfo.id.toString(),
      metadata: paymentInfo
    });
    
    if (updatePaymentStatusDto[0]) {
      console.error('Error creando DTO:', updatePaymentStatusDto[0]);
      res.status(400).json({ error: updatePaymentStatusDto[0] });
      return;
    }
    
    // Actualizamos el pago
    const updatedPayment = await this.paymentRepository.updatePaymentStatus(updatePaymentStatusDto[1]!);
    
    // Si el pago está aprobado, actualizamos el estado de la venta
    if (paymentInfo.status === 'approved') {
      await this.saleRepository.updateStatus(payment.saleId, {
        status: 'completed',
        notes: `Pago aprobado con ID ${paymentInfo.id}`
      });
      
      // Aquí podrías enviar una notificación al cliente, generar factura, etc.
    }
    
    // Siempre respondemos con 200 OK para que Mercado Pago no reintente
    res.status(200).json({
      message: 'Notificación procesada exitosamente',
      paymentStatus: paymentInfo.status
    });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    // Siempre respondemos con 200 OK para que Mercado Pago no reintente
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