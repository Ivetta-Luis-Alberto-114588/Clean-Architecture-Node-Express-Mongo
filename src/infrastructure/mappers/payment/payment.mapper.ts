// src/infrastructure/mappers/payment/payment.mapper.ts
import { PaymentEntity, PaymentMethod, PaymentProvider } from "../../../domain/entities/payment/payment.entity";
import { MercadoPagoPaymentStatus } from "../../../domain/interfaces/payment/mercado-pago.interface";
import { CustomError } from "../../../domain/errors/custom.error";
import { CustomerMapper } from "../customers/customer.mapper";
import { SaleMapper } from "../sales/sale.mapper";
import { CustomerEntity } from "../../../domain/entities/customers/customer";
import { OrderEntity } from "../../../domain/entities/order/order.entity";

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
          id: 0,
          name: 'Barrio Desconocido',
          description: 'No poblado',
          city: {
            id: 0,
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
        : placeholderCustomer;

      // Mapeamos la venta si está poblada
      const sale = typeof saleId === 'object' && saleId !== null
        ? SaleMapper.fromObjectToSaleEntity(saleId)
        : new OrderEntity(
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
          'pending', // status
          '' // notes (opcional)
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