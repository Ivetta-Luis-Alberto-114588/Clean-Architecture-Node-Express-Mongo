// src/infrastructure/datasources/payment/payment.mongo.datasource.impl.ts

import mongoose from "mongoose"; // Importar mongoose
import { v4 as uuidv4 } from 'uuid'; // Asegurar importación

import { CustomError } from "../../../domain/errors/custom.error";
import { PaymentModel } from "../../../data/mongodb/models/payment/payment.model";
import { PaymentDataSource } from "../../../domain/datasources/payment/payment.datasource";
import { CreatePaymentDto } from "../../../domain/dtos/payment/create-payment.dto";
import { ProcessWebhookDto } from "../../../domain/dtos/payment/process-webhook.dto";
import { UpdatePaymentStatusDto } from "../../../domain/dtos/payment/update-payment-status.dto";
import { VerifyPaymentDto } from "../../../domain/dtos/payment/verify-payment.dto";
import { PaymentEntity, PaymentMethod, PaymentProvider } from "../../../domain/entities/payment/payment.entity";
import { MercadoPagoPayment, MercadoPagoPaymentStatus, MercadoPagoPreferenceResponse } from "../../../domain/interfaces/payment/mercado-pago.interface";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { MercadoPagoAdapter } from "../../adapters/mercado-pago.adapter";
import { OrderModel } from "../../../data/mongodb/models/order/order.model"; // Importar OrderModel
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model"; // Importar CustomerModel
import { PaymentMapper } from "../../mappers/payment/payment.mapper";
import logger from "../../../configs/logger"; // Importar logger

export class PaymentMongoDataSourceImpl implements PaymentDataSource {

  private readonly mercadoPagoAdapter = MercadoPagoAdapter.getInstance();

  // --- Helper para poblar relaciones ---
  private async getPopulatedPayment(query: mongoose.FilterQuery<any>): Promise<any> {
    return PaymentModel.findOne(query)
      .populate({
        path: 'saleId',
        model: 'Order', // <<<--- CORREGIDO: Usar 'Order'
        populate: {
          path: 'customer',
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            model: 'Neighborhood', // Asegurar nombre correcto
            populate: {
              path: 'city',
              model: 'City' // Asegurar nombre correcto
            }
          }
        }
      })
      .populate({
        path: 'customerId',
        model: 'Customer', // Asegurar nombre correcto
        populate: {
          path: 'neighborhood',
          model: 'Neighborhood', // Asegurar nombre correcto
          populate: {
            path: 'city',
            model: 'City' // Asegurar nombre correcto
          }
        }
      });
  }

  private async getPopulatedPayments(query: mongoose.FilterQuery<any>, pagination: { skip: number, limit: number }): Promise<any[]> {
    return PaymentModel.find(query)
      .populate({
        path: 'saleId',
        model: 'Order', // <<<--- CORREGIDO: Usar 'Order'
        populate: {
          path: 'customer',
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            model: 'Neighborhood', // Asegurar nombre correcto
            populate: {
              path: 'city',
              model: 'City' // Asegurar nombre correcto
            }
          }
        }
      })
      .populate({
        path: 'customerId',
        model: 'Customer', // Asegurar nombre correcto
        populate: {
          path: 'neighborhood',
          model: 'Neighborhood', // Asegurar nombre correcto
          populate: {
            path: 'city',
            model: 'City' // Asegurar nombre correcto
          }
        }
      })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort({ createdAt: -1 });
  }


  async createPreference(createPaymentDto: CreatePaymentDto): Promise<MercadoPagoPreferenceResponse> {
    try {
      const preferenceRequest = {
        items: createPaymentDto.items,
        payer: createPaymentDto.payer,
        back_urls: createPaymentDto.backUrls,
        auto_return: 'approved' as const,
        external_reference: createPaymentDto.externalReference || `sale-${createPaymentDto.saleId}`,
        notification_url: createPaymentDto.notificationUrl,
        statement_descriptor: 'Tu Tienda Online', // Puedes hacerlo configurable
        metadata: createPaymentDto.metadata || { uuid: uuidv4() }, // Usar uuidv4 importado
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      };

      const idempotencyConfig = createPaymentDto.idempotencyKey
        ? { idempotencyKey: createPaymentDto.idempotencyKey }
        : undefined;

      const preference = await this.mercadoPagoAdapter.createPreference(
        preferenceRequest,
        idempotencyConfig
      );

      return preference;
    } catch (error) {
      logger.error("Error creando preferencia de MP en datasource", { error, dto: createPaymentDto });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al crear preferencia de pago: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async savePayment(createPaymentDto: CreatePaymentDto, preferenceResponse: MercadoPagoPreferenceResponse): Promise<PaymentEntity> {
    try {
      // Buscar por idempotencia primero
      if (createPaymentDto.idempotencyKey) {
        const existingPaymentDoc = await PaymentModel.findOne({
          idempotencyKey: createPaymentDto.idempotencyKey
        });
        if (existingPaymentDoc) {
          logger.warn(`Pago reutilizado por idempotencia: ${createPaymentDto.idempotencyKey}`);
          // Actualizar la preferenceId si es diferente (poco probable pero posible)
          if (existingPaymentDoc.preferenceId !== preferenceResponse.id) {
            existingPaymentDoc.preferenceId = preferenceResponse.id;
            await existingPaymentDoc.save();
          }
          const populated = await this.getPopulatedPayment({ _id: existingPaymentDoc._id });
          if (!populated) throw CustomError.internalServerError("Error al recuperar pago existente por idempotencia");
          return PaymentMapper.fromObjectToPaymentEntity(populated);
        }
      }

      // Crear nuevo pago
      const paymentData = {
        saleId: new mongoose.Types.ObjectId(createPaymentDto.saleId),
        customerId: new mongoose.Types.ObjectId(createPaymentDto.customerId),
        amount: createPaymentDto.amount,
        provider: createPaymentDto.provider,
        status: MercadoPagoPaymentStatus.PENDING,
        externalReference: preferenceResponse.external_reference || `sale-${createPaymentDto.saleId}`,
        providerPaymentId: '', // Se actualiza con el webhook o verificación
        preferenceId: preferenceResponse.id,
        paymentMethod: createPaymentDto.paymentMethod || PaymentMethod.OTHER,
        idempotencyKey: createPaymentDto.idempotencyKey,
        metadata: {
          // Considera guardar solo datos esenciales para evitar documentos muy grandes
          // createPaymentDto_itemsCount: createPaymentDto.items.length,
          // payerEmail: createPaymentDto.payer.email,
          preferenceResponseId: preferenceResponse.id,
          uuid: (createPaymentDto.metadata as any)?.uuid || uuidv4()
        }
      };

      const payment = await PaymentModel.create(paymentData);
      logger.info(`Nuevo pago guardado en DB: ${payment._id} para pref: ${preferenceResponse.id}`);

      const populatedPayment = await this.getPopulatedPayment({ _id: payment._id });
      if (!populatedPayment) throw CustomError.internalServerError('Error al recuperar el pago recién guardado');

      return PaymentMapper.fromObjectToPaymentEntity(populatedPayment);
    } catch (error) {
      logger.error("Error guardando pago en datasource", { error, dto: createPaymentDto, prefId: preferenceResponse?.id });
      if (error instanceof mongoose.Error.ValidationError) throw CustomError.badRequest(`Error de validación al guardar pago: ${error.message}`);
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al guardar pago: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPaymentById(id: string): Promise<PaymentEntity> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) throw CustomError.badRequest("ID de pago inválido");
      const payment = await this.getPopulatedPayment({ _id: id });
      if (!payment) throw CustomError.notFound(`Pago con ID ${id} no encontrado`);
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      logger.error(`Error obteniendo pago por ID ${id}`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener pago: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPaymentByExternalReference(externalReference: string): Promise<PaymentEntity | null> {
    try {
      const payment = await this.getPopulatedPayment({ externalReference });
      if (!payment) return null;
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      logger.error(`Error obteniendo pago por externalReference ${externalReference}`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener pago por referencia externa: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPaymentByPreferenceId(preferenceId: string): Promise<PaymentEntity | null> {
    try {
      const payment = await this.getPopulatedPayment({ preferenceId });
      if (!payment) return null;
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      logger.error(`Error obteniendo pago por preferenceId ${preferenceId}`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener pago por ID de preferencia: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPaymentsBySaleId(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(saleId)) throw CustomError.badRequest("ID de venta inválido");
      const { page, limit } = paginationDto;
      const skip = (page - 1) * limit;
      const payments = await this.getPopulatedPayments({ saleId: new mongoose.Types.ObjectId(saleId) }, { skip, limit });
      return payments.map(payment => PaymentMapper.fromObjectToPaymentEntity(payment));
    } catch (error) {
      logger.error(`Error obteniendo pagos por saleId ${saleId}`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener pagos por ID de venta: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPaymentsByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(customerId)) throw CustomError.badRequest("ID de cliente inválido");
      const { page, limit } = paginationDto;
      const skip = (page - 1) * limit;
      const payments = await this.getPopulatedPayments({ customerId: new mongoose.Types.ObjectId(customerId) }, { skip, limit });
      return payments.map(payment => PaymentMapper.fromObjectToPaymentEntity(payment));
    } catch (error) {
      logger.error(`Error obteniendo pagos por customerId ${customerId}`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener pagos por ID de cliente: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updatePaymentStatus(updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<PaymentEntity> {
    try {
      const { paymentId, status, providerPaymentId, metadata } = updatePaymentStatusDto;
      if (!mongoose.Types.ObjectId.isValid(paymentId)) throw CustomError.badRequest("ID de pago inválido");

      const updateData: any = { status, providerPaymentId };
      if (metadata) {
        updateData['$set'] = { 'metadata.paymentInfo': metadata };
      }

      // Solo actualiza si el estado o el providerPaymentId son diferentes
      const updatedPayment = await PaymentModel.findOneAndUpdate(
        {
          _id: paymentId,
          $or: [
            { status: { $ne: status } },
            { providerPaymentId: { $ne: providerPaymentId } }
          ]
        },
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedPayment) {
        const existingPayment = await PaymentModel.findById(paymentId);
        if (!existingPayment) throw CustomError.notFound(`Pago con ID ${paymentId} no encontrado para actualizar`);
        logger.info(`No fue necesario actualizar el pago ${paymentId} (mismo estado y providerId)`);
        const currentPopulated = await this.getPopulatedPayment({ _id: paymentId });
        if (!currentPopulated) throw CustomError.internalServerError("Error recuperando pago sin cambios");
        return PaymentMapper.fromObjectToPaymentEntity(currentPopulated);
      }

      logger.info(`Estado de pago ${paymentId} actualizado a ${status} con providerId ${providerPaymentId}`);
      const populatedPayment = await this.getPopulatedPayment({ _id: updatedPayment._id });
      if (!populatedPayment) throw CustomError.internalServerError('Error al obtener el pago actualizado');

      return PaymentMapper.fromObjectToPaymentEntity(populatedPayment);

    } catch (error) {
      logger.error(`Error actualizando estado de pago ${updatePaymentStatusDto.paymentId}`, { error, dto: updatePaymentStatusDto });
      if (error instanceof mongoose.Error.ValidationError) throw CustomError.badRequest(`Error de validación al actualizar pago: ${error.message}`);
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al actualizar estado del pago: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<MercadoPagoPayment> {
    try {
      const { providerPaymentId } = verifyPaymentDto;
      // La lógica principal es llamar al adaptador de MP
      const paymentInfo = await this.mercadoPagoAdapter.getPayment(providerPaymentId);
      return paymentInfo;
    } catch (error) {
      logger.error(`Error verificando pago con provider ${verifyPaymentDto.providerPaymentId}`, { error });
      if (error instanceof CustomError) throw error;
      // Podríamos intentar mapear errores específicos de MP aquí si es necesario
      throw CustomError.internalServerError(`Error al verificar pago con proveedor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async processWebhook(processWebhookDto: ProcessWebhookDto): Promise<PaymentEntity> {
    try {
      const { type, data } = processWebhookDto;
      if (type !== 'payment') {
        logger.warn(`Webhook ignorado: tipo ${type} no es 'payment'`);
        throw CustomError.badRequest('Tipo de notificación no soportado'); // Lanzar error para que el Use Case lo maneje
      }

      const providerPaymentId = data.id;
      logger.info(`Procesando webhook para pago MP ID: ${providerPaymentId}`);

      // 1. Obtener info del pago desde MP
      const paymentInfo = await this.mercadoPagoAdapter.getPayment(providerPaymentId);
      logger.debug(`Info de MP obtenida para ${providerPaymentId}`, { status: paymentInfo.status, ref: paymentInfo.external_reference });

      // 2. Buscar nuestro pago usando la referencia externa
      const payment = await PaymentModel.findOne({
        externalReference: paymentInfo.external_reference
      });

      if (!payment) {
        logger.error(`Pago local no encontrado para external_reference: ${paymentInfo.external_reference} (Webhook para MP ID: ${providerPaymentId})`);
        // Es importante NO lanzar un error 500 aquí, porque MP seguirá reintentando.
        // Lanzar un error específico que el Use Case pueda interpretar como "ignorable".
        throw CustomError.notFound(`Pago no encontrado para referencia ${paymentInfo.external_reference}, webhook ignorado.`);
      }

      // 3. Actualizar nuestro pago (usando el método ya existente)
      const [dtoError, updateDto] = UpdatePaymentStatusDto.create({
        paymentId: payment._id.toString(),
        status: paymentInfo.status,
        providerPaymentId: paymentInfo.id.toString(),
        metadata: paymentInfo // Guardar toda la info de MP
      });
      if (dtoError) {
        // Error creando el DTO, esto es un problema interno grave
        logger.error("Error creando DTO de actualización desde webhook", { dtoError, paymentId: payment._id });
        throw CustomError.internalServerError(`Error interno procesando datos de webhook: ${dtoError}`);
      }

      const updatedPayment = await this.updatePaymentStatus(updateDto!); // Reutiliza la lógica de actualización
      logger.info(`Pago ${payment._id} actualizado vía webhook a estado ${paymentInfo.status}`);

      return updatedPayment; // updatePaymentStatus ya devuelve la entidad poblada

    } catch (error) {
      // No relanzar errores Not Found específicos del webhook para evitar reintentos
      if (error instanceof CustomError && error.statusCode === 404 && error.message.includes('webhook ignorado')) {
        logger.warn(error.message);
        // Podríamos necesitar devolver algo o que el UseCase maneje este caso específico.
        // Por ahora, simplemente no relanzamos el error para detener el procesamiento aquí.
        // ¡OJO! Esto significa que el UseCase no recibirá error y podría continuar.
        // Es mejor relanzar y que el Use Case decida.
        throw error;
      }

      logger.error(`Error procesando webhook en datasource`, { error, dto: processWebhookDto });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al procesar webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAllPayments(paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      const { page, limit } = paginationDto;
      const skip = (page - 1) * limit;
      const payments = await this.getPopulatedPayments({}, { skip, limit });
      return payments.map(payment => PaymentMapper.fromObjectToPaymentEntity(payment));
    } catch (error) {
      logger.error(`Error obteniendo todos los pagos`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener todos los pagos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentEntity | null> {
    try {
      const payment = await this.getPopulatedPayment({ idempotencyKey });
      if (!payment) return null;
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      logger.error(`Error obteniendo pago por idempotencyKey ${idempotencyKey}`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener pago por clave de idempotencia: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  async getPaymentByProviderPaymentId(providerPaymentId: string): Promise<PaymentEntity | null> {
    try {
      const payment = await this.getPopulatedPayment({ providerPaymentId });
      if (!payment) return null;
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      logger.error(`Error obteniendo pago por providerPaymentId ${providerPaymentId}`, { error });
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error al obtener pago por ID de proveedor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}