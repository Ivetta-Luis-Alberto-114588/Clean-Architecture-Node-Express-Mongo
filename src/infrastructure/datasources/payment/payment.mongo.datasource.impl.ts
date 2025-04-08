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
import { OrderModel } from "../../../data/mongodb/models/order/order.model";
import { CustomerModel } from "../../../data/mongodb/models/customers/customer.model";
import { PaymentMapper } from "../../mappers/payment/payment.mapper";
import { v4 } from 'uuid';

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
        metadata: createPaymentDto.metadata || { uuid: v4 },
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
        // expires: false,       
        // expiration_date_from: undefined,        
        // expiration_date_to: undefined 
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

      // Creamos un objeto con los campos a actualizar
      const updateData: any = {
        status: status,
        providerPaymentId: providerPaymentId
      };

      // Si hay metadata, la incluimos en la actualización
      if (metadata) {
        // Usamos $set para actualizar solo el campo paymentInfo dentro de metadata
        // preservando el resto de los campos que pueda tener
        updateData['$set'] = {
          'metadata.paymentInfo': metadata
        };
      }

      // Realizamos la actualización atómica con condiciones
      // La condición asegura que solo se actualizará si:
      // 1. El documento existe
      // 2. O bien el estado es diferente, o bien el providerPaymentId es diferente
      const updatedPayment = await PaymentModel.findOneAndUpdate(
        {
          _id: paymentId,
          $or: [
            { status: { $ne: status } },
            { providerPaymentId: { $ne: providerPaymentId } }
          ]
        },
        updateData,
        {
          new: true, // Para que devuelva el documento actualizado
          runValidators: true // Para asegurar que se ejecutan las validaciones del esquema
        }
      );

      // Si no se actualizó nada, verificamos si el pago existe
      if (!updatedPayment) {
        // Comprobamos si el pago existe
        const existingPayment = await PaymentModel.findById(paymentId);
        if (!existingPayment) {
          throw CustomError.notFound(`Pago con ID ${paymentId} no encontrado`);
        }

        // Si existe pero no se actualizó, es porque ya tiene el mismo estado y providerPaymentId
        console.log(`No fue necesario actualizar el pago ${paymentId}: mismo estado y providerPaymentId`);

        // Devolvemos el pago existente sin cambios pero con las relaciones populadas
        const currentPayment = await PaymentModel.findById(paymentId)
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

        return PaymentMapper.fromObjectToPaymentEntity(currentPayment);
      }

      // Si se realizó la actualización, populamos las relaciones
      const populatedPayment = await PaymentModel.findById(updatedPayment._id)
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
        throw CustomError.internalServerError('Error al obtener el pago actualizado de la base de datos');
      }

      return PaymentMapper.fromObjectToPaymentEntity(populatedPayment);

    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      console.error(`Error al actualizar estado del pago:`, error);
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


  async getPaymentByProviderPaymentId(providerPaymentId: string): Promise<PaymentEntity | null> {
    try {
      const payment = await PaymentModel.findOne({ providerPaymentId })
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
      throw CustomError.internalServerError(`Error al obtener pago por ID de proveedor: ${error}`);
    }
  }

}

function uuidv4() {
  throw new Error("Function not implemented.");
}
