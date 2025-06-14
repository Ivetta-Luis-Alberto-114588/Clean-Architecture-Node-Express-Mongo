// src/infrastructure/mappers/payment/payment.mapper.ts
import { PaymentEntity, PaymentMethod, PaymentProvider } from "../../../domain/entities/payment/payment.entity";
import { MercadoPagoPaymentStatus } from "../../../domain/interfaces/payment/mercado-pago.interface";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../customers/customer.mapper";
import { OrderMapper } from "../order/order.mapper";
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { OrderEntity } from "../../../domain/entities/order/order.entity";
import { OrderStatusEntity } from "../../../domain/entities/order/order-status.entity";

export class PaymentMapper {
  static fromObjectToPaymentEntity(object: any): PaymentEntity {
    try {
      const {
        _id,
        id,
        saleId,
        customerId,
        amount,
        provider,
        status,
        externalReference,
        providerPaymentId,
        preferenceId,
        paymentMethod,
        createdAt,
        updatedAt,
        metadata,
        idempotencyKey
      } = object;

      // Validaciones básicas
      if (!_id && !id) throw CustomError.badRequest('payment mapper: missing id');
      if (!saleId) throw CustomError.badRequest('payment mapper: missing saleId');
      if (!customerId) throw CustomError.badRequest('payment mapper: missing customerId');
      if (amount === undefined) throw CustomError.badRequest('payment mapper: missing amount');
      if (!externalReference) throw CustomError.badRequest('payment mapper: missing externalReference');
      if (!preferenceId) throw CustomError.badRequest('payment mapper: missing preferenceId');

      // Crear cliente temporal para cuando no está poblado
      const placeholderCustomer = new CustomerEntity(
        0,
        'Cliente Desconocido',
        'desconocido@ejemplo.com',
        '000000000',
        'Dirección Desconocida',
        {
          id: '',
          name: 'Barrio Desconocido',
          description: 'No poblado',
          city: {
            id: '',
            name: 'Ciudad Desconocida',
            description: 'No poblada',
            isActive: true
          },
          isActive: true
        },
        true
      );

      // Mapeamos el cliente si está poblado
      const customer = typeof customerId === 'object' && customerId !== null
        ? CustomerMapper.fromObjectToCustomerEntity(customerId)
        : placeholderCustomer;      // Crear un OrderStatusEntity por defecto para casos donde no hay venta poblada
      const defaultStatus = new OrderStatusEntity(
        '683a1a39dd398aae92ab05f6', // id
        'PENDING', // code
        'Pendiente', // name
        'Estado inicial del pedido', // description
        '#FFA500', // color
        0, // order
        true, // isActive
        true, // isDefault
        [] // canTransitionTo
      );

      // Mapeamos la venta si está poblada
      const sale = typeof saleId === 'object' && saleId !== null
        ? OrderMapper.fromObjectToSaleEntity(saleId)        : new OrderEntity(
          saleId.toString(),
          customer,
          [], // items vacíos
          0,  // subtotal
          0,  // taxRate
          0,  // taxAmount
          0,  // discountRate
          0,  // discountAmount
          0,  // total
          new Date(), // date
          defaultStatus, // status
          undefined, // paymentMethod (opcional)
          '', // notes (opcional)
          undefined // shippingDetails (opcional)
        );

      // Valores por defecto para campos opcionales
      const paymentStatus = status || MercadoPagoPaymentStatus.PENDING;
      const paymentProvider = provider || PaymentProvider.MERCADO_PAGO;
      const paymentPaymentMethod = paymentMethod || PaymentMethod.OTHER;

      return new PaymentEntity(
        _id?.toString() || id?.toString(),
        typeof saleId === 'object' ? saleId._id.toString() : saleId.toString(),
        sale,
        typeof customerId === 'object' ? customerId._id.toString() : customerId.toString(),
        customer,
        Number(amount),
        paymentProvider,
        paymentStatus,
        externalReference,
        providerPaymentId || '',
        preferenceId,
        paymentPaymentMethod,
        createdAt ? new Date(createdAt) : new Date(),
        updatedAt ? new Date(updatedAt) : new Date(),
        metadata || {},
        idempotencyKey
      );
    } catch (error) {
      if (error instanceof CustomError) throw error;
      throw CustomError.internalServerError(`Error en payment mapper: ${error}`);
    }
  }

  static fromPaymentEntityToObject(entity: PaymentEntity): any {
    return {
      saleId: entity.saleId,
      customerId: entity.customerId,
      amount: entity.amount,
      provider: entity.provider,
      status: entity.status,
      externalReference: entity.externalReference,
      providerPaymentId: entity.providerPaymentId,
      preferenceId: entity.preferenceId,
      paymentMethod: entity.paymentMethod,
      metadata: entity.metadata,
      idempotencyKey: entity.idempotencyKey
    };
  }
}