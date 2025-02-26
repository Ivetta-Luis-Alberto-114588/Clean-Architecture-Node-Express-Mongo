// src/infrastructure/datasources/payment/payment.mongo.datasource.impl.ts

import { CustomError } from "../../../domain/errors/custom.error";
import { PaymentModel } from "../../../data/mongodb/models/payment/payment.model";
import { PaymentDataSource } from "../../../domain/datasources/payment/payment.datasource";
import { CreatePaymentDto } from "../../../domain/dtos/payment/create-payment.dto";
import { ProcessWebhookDto } from "../../../domain/dtos/payment/process-webhook.dto";
import { UpdatePaymentStatusDto } from "../../../domain/dtos/payment/update-payment-status.dto";
import { VerifyPaymentDto } from "../../../domain/dtos/payment/verify-payment.dto";
import { PaymentEntity } from "../../../domain/entities/payment/payment.entity";
import { MercadoPagoPayment, MercadoPagoPaymentStatus, MercadoPagoPreferenceResponse } from "../../../domain/interfaces/payment/mercado-pago.interface";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { MercadoPagoAdapter } from "../../adapters/mercado-pago.adapter";
import { SaleModel } from "../../../data/mongodb/models/sales/sale.model";
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { PaymentMapper } from "../../mappers/payment/payment.mapper";

export class PaymentMongoDataSourceImpl implements PaymentDataSource {
  
  private readonly mercadoPagoAdapter = MercadoPagoAdapter.getInstance();
  
  async createPreference(createPaymentDto: CreatePaymentDto): Promise<MercadoPagoPreferenceResponse> {
    try {
      // Crear la preferencia en Mercado Pago
      const preferenceRequest = {
        items: createPaymentDto.items,
        payer: createPaymentDto.payer,
        back_urls: createPaymentDto.backUrls,
        auto_return: 'approved' as const,
        external_reference: createPaymentDto.externalReference || `sale-${createPaymentDto.saleId}`,
        notification_url: createPaymentDto.notificationUrl,
        statement_descriptor: 'Tu Tienda Online',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      };
      
      // Configuración de idempotencia si se proporciona una clave
      const idempotencyConfig = createPaymentDto.idempotencyKey
        ? { idempotencyKey: createPaymentDto.idempotencyKey }
        : undefined;
      
      const preference = await this.mercadoPagoAdapter.createPreference(
        preferenceRequest,
        idempotencyConfig
      );
      
      return preference;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al crear preferencia de pago: ${error}`);
    }
  }
  
  async savePayment(createPaymentDto: CreatePaymentDto, preferenceResponse: MercadoPagoPreferenceResponse): Promise<PaymentEntity> {
    try {
      // Buscar si ya existe un pago con la misma clave de idempotencia
      if (createPaymentDto.idempotencyKey) {
        const existingPayment = await PaymentModel.findOne({
          idempotencyKey: createPaymentDto.idempotencyKey
        });
        
        if (existingPayment) {
          // Actualizar la referencia a la nueva preferencia
          existingPayment.preferenceId = preferenceResponse.id;
          await existingPayment.save();
          return PaymentMapper.fromObjectToPaymentEntity(existingPayment);
        }
      }
      
      // Crear un nuevo pago
      const paymentData = {
        saleId: createPaymentDto.saleId,
        customerId: createPaymentDto.customerId,
        amount: createPaymentDto.amount,
        provider: createPaymentDto.provider,
        status: MercadoPagoPaymentStatus.PENDING,
        externalReference: preferenceResponse.external_reference || `sale-${createPaymentDto.saleId}`,
        providerPaymentId: '',
        preferenceId: preferenceResponse.id,
        paymentMethod: createPaymentDto.paymentMethod,
        idempotencyKey: createPaymentDto.idempotencyKey,
        metadata: {
          createPaymentDto: createPaymentDto,
          preferenceResponse: preferenceResponse
        }
      };
      
      const payment = await PaymentModel.create(paymentData);
      
      const populatedPayment = await PaymentModel.findById(payment._id)
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        });
      
      if (!populatedPayment) {
        throw CustomError.internalServerError('Error al guardar el pago en la base de datos');
      }
      
      return PaymentMapper.fromObjectToPaymentEntity(populatedPayment);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al guardar pago: ${error}`);
    }
  }
  
  async getPaymentById(id: string): Promise<PaymentEntity> {
    try {
      const payment = await PaymentModel.findById(id)
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        });
      
      if (!payment) {
        throw CustomError.notFound(`Pago con ID ${id} no encontrado`);
      }
      
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener pago: ${error}`);
    }
  }
  
  async getPaymentByExternalReference(externalReference: string): Promise<PaymentEntity | null> {
    try {
      const payment = await PaymentModel.findOne({ externalReference })
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        });
      
      if (!payment) return null;
      
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener pago por referencia externa: ${error}`);
    }
  }
  
  async getPaymentByPreferenceId(preferenceId: string): Promise<PaymentEntity | null> {
    try {
      const payment = await PaymentModel.findOne({ preferenceId })
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        });
      
      if (!payment) return null;
      
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener pago por ID de preferencia: ${error}`);
    }
  }
  
  async getPaymentsBySaleId(saleId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      const { page, limit } = paginationDto;
      
      const payments = await PaymentModel.find({ saleId })
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      return payments.map(payment => PaymentMapper.fromObjectToPaymentEntity(payment));
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener pagos por ID de venta: ${error}`);
    }
  }
  
  async getPaymentsByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      const { page, limit } = paginationDto;
      
      const payments = await PaymentModel.find({ customerId })
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      return payments.map(payment => PaymentMapper.fromObjectToPaymentEntity(payment));
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener pagos por ID de cliente: ${error}`);
    }
  }
  
  async updatePaymentStatus(updatePaymentStatusDto: UpdatePaymentStatusDto): Promise<PaymentEntity> {
    try {
      const { paymentId, status, providerPaymentId, metadata } = updatePaymentStatusDto;
      
      const payment = await PaymentModel.findById(paymentId);
      
      if (!payment) {
        throw CustomError.notFound(`Pago con ID ${paymentId} no encontrado`);
      }
      
      // Actualizar el estado del pago
      payment.status = status;
      payment.providerPaymentId = providerPaymentId;
      if (metadata) {
        payment.metadata = { 
          ...payment.metadata, 
          paymentInfo: metadata 
        };
      }
      
      await payment.save();
      
      const updatedPayment = await PaymentModel.findById(paymentId)
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        });
      
      if (!updatedPayment) {
        throw CustomError.internalServerError('Error al actualizar el pago en la base de datos');
      }
      
      return PaymentMapper.fromObjectToPaymentEntity(updatedPayment);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al actualizar estado del pago: ${error}`);
    }
  }
  
  async verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<MercadoPagoPayment> {
    try {
      const { providerPaymentId } = verifyPaymentDto;
      
      // Obtener el pago de Mercado Pago
      const paymentInfo = await this.mercadoPagoAdapter.getPayment(providerPaymentId);
      
      return paymentInfo;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al verificar pago: ${error}`);
    }
  }
  
  async processWebhook(processWebhookDto: ProcessWebhookDto): Promise<PaymentEntity> {
    try {
      const { type, action, data } = processWebhookDto;
      
      // Solo procesamos notificaciones de pagos
      if (type !== 'payment') {
        throw CustomError.badRequest('Tipo de notificación no soportado');
      }
      
      // Obtener el pago de Mercado Pago
      const paymentInfo = await this.mercadoPagoAdapter.getPayment(data.id);
      
      // Buscar el pago en nuestra base de datos por referencia externa
      const payment = await PaymentModel.findOne({
        externalReference: paymentInfo.external_reference
      });
      
      if (!payment) {
        throw CustomError.notFound(`Pago con referencia externa ${paymentInfo.external_reference} no encontrado`);
      }
      
      // Actualizar el estado del pago
      payment.status = paymentInfo.status;
      payment.providerPaymentId = paymentInfo.id.toString();
      payment.metadata = {
        ...payment.metadata,
        paymentInfo
      };
      
      await payment.save();
      
      const updatedPayment = await PaymentModel.findById(payment._id)
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        });
      
      if (!updatedPayment) {
        throw CustomError.internalServerError('Error al actualizar el pago en la base de datos');
      }
      
      return PaymentMapper.fromObjectToPaymentEntity(updatedPayment);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al procesar webhook: ${error}`);
    }
  }
  
  async getAllPayments(paginationDto: PaginationDto): Promise<PaymentEntity[]> {
    try {
      const { page, limit } = paginationDto;
      
      const payments = await PaymentModel.find()
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      return payments.map(payment => PaymentMapper.fromObjectToPaymentEntity(payment));
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener todos los pagos: ${error}`);
    }
  }
  
  async getPaymentByIdempotencyKey(idempotencyKey: string): Promise<PaymentEntity | null> {
    try {
      const payment = await PaymentModel.findOne({ idempotencyKey })
        .populate({
          path: 'saleId',
          model: 'Sale',
          populate: {
            path: 'customer',
            model: 'Customer',
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
          model: 'Customer',
          populate: {
            path: 'neighborhood',
            populate: {
              path: 'city'
            }
          }
        });
      
      if (!payment) return null;
      
      return PaymentMapper.fromObjectToPaymentEntity(payment);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServerError(`Error al obtener pago por clave de idempotencia: ${error}`);
    }
  }
}