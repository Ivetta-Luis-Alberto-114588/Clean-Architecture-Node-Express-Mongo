// src/presentation/payment/controller.payment.ts

// <<<--- AÑADIR IMPORTACIONES --- >>>
import { Request, Response } from "express"; // Importar tipos de Express
import { CustomError } from "../../domain/errors/custom.error";
import { PaymentRepository } from "../../domain/repositories/payment/payment.repository";
import { OrderRepository } from "../../domain/repositories/order/order.repository";
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
import { GetPaymentByOrderUseCase } from "../../domain/use-cases/payment/get-payment-by-order.use-case";
import { GetAllPaymentsUseCase } from "../../domain/use-cases/payment/get-all-payments.use-case";
import { PaymentEntity, PaymentProvider } from "../../domain/entities/payment/payment.entity"; // Importar PaymentEntity y PaymentProvider
import { MercadoPagoItem, MercadoPagoPayer, MercadoPagoPayment } from "../../domain/interfaces/payment/mercado-pago.interface"; // Importar interfaces de MP
import { envs } from "../../configs/envs";
import { MercadoPagoAdapter } from "../../infrastructure/adapters/mercado-pago.adapter";
import { PaymentModel } from "../../data/mongodb/models/payment/payment.model";
import { v4 as uuidv4 } from 'uuid';
// <<<--- FIN IMPORTACIONES --- >>>

export class PaymentController {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository
  ) { }

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

      const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
      // <<<--- Pasar preferenceBody al adaptador --- >>>
      const preference = await mercadoPagoAdapter.preferencePrueba(preferenceBody); // Pasar el body correcto

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
        });

      res.json({
        payment: populatedPayment,
        preference: {
          id: preference.id,
          init_point: preference.init_point,
          sandbox_init_point: preference.sandbox_init_point
        }
      });
    } catch (error) {
      // <<<--- Corregir llamada a handleError --- >>>
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
      }

      const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
      const preferenceInfo = await mercadoPagoAdapter.getPreference(preferenceId);

      let paymentInfo: MercadoPagoPayment | null = null; // Definir tipo explícito
      if (payment.providerPaymentId) {
        paymentInfo = await mercadoPagoAdapter.getPayment(payment.providerPaymentId);
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
      console.log('Webhook recibido:', { query: req.query, body: req.body, headers: req.headers });

      let paymentId;

      if (req.query.id && req.query.topic) {
        const topic = req.query.topic as string;
        paymentId = req.query.id as string;
        if (topic !== 'payment') {
          console.log(`Ignorando notificación de tipo: ${topic}`);
          res.status(200).json({ message: 'Notificación recibida pero ignorada (topic no relevante)' });
          return;
        }
      }
      else if (req.body.data && req.body.type) {
        const type = req.body.type as string;
        paymentId = req.body.data.id as string;
        if (type !== 'payment') {
          console.log(`Ignorando notificación de tipo: ${type}`);
          res.status(200).json({ message: 'Notificación recibida pero ignorada (type no relevante)' });
          return;
        }
      } else {
        console.log('Formato de notificación no reconocido');
        res.status(400).json({ message: 'Formato de notificación no reconocido' });
        return;
      }

      if (!paymentId) {
        console.log('ID de pago no encontrado en la notificación');
        res.status(400).json({ message: 'ID de pago no encontrado en la notificación' });
        return;
      }

      const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
      const paymentInfo = await mercadoPagoAdapter.getPayment(paymentId);

      const payment = await this.paymentRepository.getPaymentByExternalReference(
        paymentInfo.external_reference
      );

      if (!payment) {
        console.log(`Pago no encontrado para external_reference: ${paymentInfo.external_reference}`);
        // Respondemos 200 OK aunque no lo encontremos para evitar reintentos de MP
        res.status(200).json({ message: 'Pago no encontrado en DB, notificación ignorada.' });
        return;
      }

      const [dtoError, updatePaymentStatusDto] = UpdatePaymentStatusDto.create({ // <<<--- Capturar error del DTO --- >>>
        paymentId: payment.id,
        status: paymentInfo.status,
        providerPaymentId: paymentInfo.id.toString(),
        metadata: paymentInfo
      });

      // <<<--- Manejar error del DTO --- >>>
      if (dtoError) {
        console.error('Error creando DTO para actualizar estado:', dtoError);
        // Respondemos 200 OK para evitar reintentos, pero logueamos el error
        res.status(200).json({ status: 'error', message: `Error interno al procesar DTO: ${dtoError}` });
        return;
      }

      const updatedPayment = await this.paymentRepository.updatePaymentStatus(updatePaymentStatusDto!); // Usar el DTO validado

      if (paymentInfo.status === 'approved') {
        await this.orderRepository.updateStatus(payment.saleId, {
          status: 'completed',
          notes: `Pago aprobado con ID ${paymentInfo.id}`
        });
      }

      res.status(200).json({
        message: 'Notificación procesada exitosamente',
        paymentStatus: paymentInfo.status
      });
    } catch (error) {
      console.error('Error procesando webhook:', error);
      res.status(200).json({ status: 'error', message: 'Error procesando webhook' });
    }
  };


  paymentSuccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId, payment_id, external_reference, status } = req.query;
      console.log('Pago exitoso:', { saleId, payment_id, external_reference, status });

      if (payment_id && (external_reference || saleId)) { // Asegurar que tenemos una referencia
        const paymentIdForVerification = external_reference?.toString() || saleId?.toString();
        if (paymentIdForVerification) {
          const [error, verifyPaymentDto] = VerifyPaymentDto.create({
            // Necesitamos el ID de *nuestro* registro de pago, no el de MP.
            // Asumimos que external_reference o saleId pueden mapear a nuestro paymentId.
            // ¡ESTO PUEDE REQUERIR AJUSTES! Buscar el pago por external_reference primero.
            paymentId: paymentIdForVerification, // ¡OJO! Esto podría no ser nuestro ID interno.
            providerPaymentId: payment_id.toString()
          });

          if (!error && verifyPaymentDto) {
            // Buscar nuestro pago por external_reference para obtener el ID correcto
            const localPayment = await this.paymentRepository.getPaymentByExternalReference(paymentIdForVerification);
            if (localPayment) {
              const [errorCorrected, verifyDtoCorrected] = VerifyPaymentDto.create({
                paymentId: localPayment.id, // Usar el ID local correcto
                providerPaymentId: payment_id.toString()
              });

              if (!errorCorrected && verifyDtoCorrected) {
                const verifyPaymentUseCase = new VerifyPaymentUseCase(
                  this.paymentRepository,
                  this.orderRepository
                );
                verifyPaymentUseCase.execute(verifyDtoCorrected)
                  .then(result => console.log('Pago verificado correctamente en success:', result.payment.id))
                  .catch(error => console.error('Error al verificar pago en success:', error));
              } else {
                console.error('Error creando DTO de verificación corregido:', errorCorrected);
              }
            } else {
              console.warn(`No se encontró pago local para external_reference: ${paymentIdForVerification} en callback success`);
            }
          } else {
            console.error('Error creando DTO de verificación inicial:', error);
          }
        } else {
          console.warn('No se pudo determinar una referencia válida (external_reference o saleId) en callback success');
        }
      }

      const redirectUrl = `${envs.FRONTEND_URL}/payment/success?saleId=${saleId || external_reference || ''}`;
      res.redirect(302, redirectUrl); // Usar 302 para redirección temporal
    } catch (error) {
      console.error('Error en paymentSuccess:', error);
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(302, redirectUrl);
    }
  };

  paymentFailure = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId, external_reference } = req.query; // Capturar también external_reference
      console.log('Pago fallido:', req.query);
      const reference = saleId || external_reference || '';
      const redirectUrl = `${envs.FRONTEND_URL}/payment/failure?saleId=${reference}`;
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('Error en paymentFailure:', error);
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(302, redirectUrl);
    }
  };

  paymentPending = async (req: Request, res: Response): Promise<void> => {
    try {
      const { saleId, external_reference } = req.query; // Capturar también external_reference
      console.log('Pago pendiente:', req.query);
      const reference = saleId || external_reference || '';
      const redirectUrl = `${envs.FRONTEND_URL}/payment/pending?saleId=${reference}`;
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('Error en paymentPending:', error);
      const redirectUrl = `${envs.FRONTEND_URL}/payment/error?message=Error procesando el pago`;
      res.redirect(302, redirectUrl);
    }
  };


  getAllMercadoPagoPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (startDate) filters.begin_date = new Date(startDate as string).toISOString(); // Asegurar formato ISO
      if (endDate) filters.end_date = new Date(endDate as string).toISOString(); // Asegurar formato ISO

      const offset = (Number(page) - 1) * Number(limit);

      const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
      const paymentsData = await mercadoPagoAdapter.getAllPayments(Number(limit), offset, filters);

      const enhancedPayments = await Promise.all(
        paymentsData.results.map(async (payment: any) => { // Tipar payment como any temporalmente
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
      if (endDate) filters.end_date = new Date(endDate as string).toISOString(); // Asegurar formato ISO
      // filters.operation_type = 'regular_payment'; // Descomentar si solo quieres cobros

      const offset = (Number(page) - 1) * Number(limit);

      const mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
      const chargesData = await mercadoPagoAdapter.getAllPayments(Number(limit), offset, filters);

      const enhancedCharges = await Promise.all(
        chargesData.results.map(async (charge: any) => { // Tipar charge como any temporalmente
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
}