// tests/domain/dtos/payment/update-payment-status.dto.test.ts
import { UpdatePaymentStatusDto } from '../../../../src/domain/dtos/payment/update-payment-status.dto';
import { MercadoPagoPaymentStatus } from '../../../../src/domain/interfaces/payment/mercado-pago.interface';
import mongoose from 'mongoose';

describe('UpdatePaymentStatusDto', () => {
  // ID válido para pruebas
  const validPaymentId = new mongoose.Types.ObjectId().toString();
  const validProviderPaymentId = '123456789';
  
  // Datos válidos para las pruebas
  const validStatusUpdateData = {
    paymentId: validPaymentId,
    status: MercadoPagoPaymentStatus.APPROVED,
    providerPaymentId: validProviderPaymentId
  };

  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Creación del DTO
    const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(validStatusUpdateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updatePaymentStatusDto).toBeInstanceOf(UpdatePaymentStatusDto);
    
    // Verificar valores
    expect(updatePaymentStatusDto?.paymentId).toBe(validPaymentId);
    expect(updatePaymentStatusDto?.status).toBe(MercadoPagoPaymentStatus.APPROVED);
    expect(updatePaymentStatusDto?.providerPaymentId).toBe(validProviderPaymentId);
    expect(updatePaymentStatusDto?.metadata).toBeUndefined();
  });

  // Prueba con metadata adicional
  test('should accept additional metadata', () => {
    // Datos con metadata
    const dataWithMetadata = {
      ...validStatusUpdateData,
      metadata: {
        transactionDetails: {
          externalResourceUrl: 'http://example.com/receipt',
          installmentAmount: 100
        },
        additionalInfo: 'Extra information'
      }
    };
    
    // Creación del DTO
    const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(dataWithMetadata);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updatePaymentStatusDto?.metadata).toEqual(dataWithMetadata.metadata);
  });

  // Prueba de validación: paymentId requerido
  test('should return error if paymentId is not provided', () => {
    // Datos inválidos (sin paymentId)
    const invalidData = {
      status: MercadoPagoPaymentStatus.APPROVED,
      providerPaymentId: validProviderPaymentId
    };
    
    // Creación del DTO
    const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe('paymentId es requerido');
    expect(updatePaymentStatusDto).toBeUndefined();
  });

  // Prueba de validación: status requerido
  test('should return error if status is not provided', () => {
    // Datos inválidos (sin status)
    const invalidData = {
      paymentId: validPaymentId,
      providerPaymentId: validProviderPaymentId
    };
    
    // Creación del DTO
    const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe('status es requerido');
    expect(updatePaymentStatusDto).toBeUndefined();
  });

  // Prueba de validación: providerPaymentId requerido
  test('should return error if providerPaymentId is not provided', () => {
    // Datos inválidos (sin providerPaymentId)
    const invalidData = {
      paymentId: validPaymentId,
      status: MercadoPagoPaymentStatus.APPROVED
    };
    
    // Creación del DTO
    const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe('providerPaymentId es requerido');
    expect(updatePaymentStatusDto).toBeUndefined();
  });

  // Prueba de validación: estado válido
  test('should return error if status is not valid', () => {
    // Datos inválidos (status no válido)
    const invalidData = {
      paymentId: validPaymentId,
      status: 'invalid_status',
      providerPaymentId: validProviderPaymentId
    };
    
    // Creación del DTO
    const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(invalidData);
    
    // Verificaciones - comprobar que el error contiene información sobre los valores válidos
    expect(error).toContain('status debe ser uno de los siguientes valores');
    expect(error).toContain(Object.values(MercadoPagoPaymentStatus).join(', '));
    expect(updatePaymentStatusDto).toBeUndefined();
  });

  // Prueba para todos los estados de pago válidos
  test('should accept all valid payment statuses', () => {
    // Probar todos los estados de pago válidos
    const statuses = Object.values(MercadoPagoPaymentStatus);
    
    for (const status of statuses) {
      const statusUpdateData = {
        ...validStatusUpdateData,
        status
      };
      
      const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(statusUpdateData);
      
      expect(error).toBeUndefined();
      expect(updatePaymentStatusDto?.status).toBe(status);
    }
  });

  // Prueba para diferentes formatos de providerPaymentId
  test('should accept different providerPaymentId formats', () => {
    // Diferentes formatos de ID
    const providerIds = ['123456789', 'MP-1234-5678', 'payment_12345'];
    
    for (const id of providerIds) {
      const statusUpdateData = {
        ...validStatusUpdateData,
        providerPaymentId: id
      };
      
      const [error, updatePaymentStatusDto] = UpdatePaymentStatusDto.create(statusUpdateData);
      
      expect(error).toBeUndefined();
      expect(updatePaymentStatusDto?.providerPaymentId).toBe(id);
    }
  });
});