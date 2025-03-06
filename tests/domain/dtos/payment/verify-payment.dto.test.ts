// tests/domain/dtos/payment/verify-payment.dto.test.ts
import { VerifyPaymentDto } from '../../../../src/domain/dtos/payment/verify-payment.dto';
import mongoose from 'mongoose';

describe('VerifyPaymentDto', () => {
  // ID válido para pruebas
  const validPaymentId = new mongoose.Types.ObjectId().toString();
  const validProviderPaymentId = '123456789';
  
  // Datos válidos para las pruebas
  const validVerifyData = {
    paymentId: validPaymentId,
    providerPaymentId: validProviderPaymentId
  };

  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Creación del DTO
    const [error, verifyPaymentDto] = VerifyPaymentDto.create(validVerifyData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(verifyPaymentDto).toBeInstanceOf(VerifyPaymentDto);
    
    // Verificar valores
    expect(verifyPaymentDto?.paymentId).toBe(validPaymentId);
    expect(verifyPaymentDto?.providerPaymentId).toBe(validProviderPaymentId);
  });

  // Prueba de validación: paymentId requerido
  test('should return error if paymentId is not provided', () => {
    // Datos inválidos (sin paymentId)
    const invalidData = {
      providerPaymentId: validProviderPaymentId
    };
    
    // Creación del DTO
    const [error, verifyPaymentDto] = VerifyPaymentDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe('paymentId es requerido');
    expect(verifyPaymentDto).toBeUndefined();
  });

  // Prueba de validación: providerPaymentId requerido
  test('should return error if providerPaymentId is not provided', () => {
    // Datos inválidos (sin providerPaymentId)
    const invalidData = {
      paymentId: validPaymentId
    };
    
    // Creación del DTO
    const [error, verifyPaymentDto] = VerifyPaymentDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe('providerPaymentId es requerido');
    expect(verifyPaymentDto).toBeUndefined();
  });

  // Prueba con paymentId vacío
  test('should return error if paymentId is empty', () => {
    // Datos inválidos (con paymentId vacío)
    const invalidData = {
      paymentId: '',
      providerPaymentId: validProviderPaymentId
    };
    
    // Creación del DTO
    const [error, verifyPaymentDto] = VerifyPaymentDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe('paymentId es requerido');
    expect(verifyPaymentDto).toBeUndefined();
  });

  // Prueba con providerPaymentId vacío
  test('should return error if providerPaymentId is empty', () => {
    // Datos inválidos (con providerPaymentId vacío)
    const invalidData = {
      paymentId: validPaymentId,
      providerPaymentId: ''
    };
    
    // Creación del DTO
    const [error, verifyPaymentDto] = VerifyPaymentDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe('providerPaymentId es requerido');
    expect(verifyPaymentDto).toBeUndefined();
  });

  // Prueba con diferentes formatos de paymentId
  test('should accept different paymentId formats', () => {
    // Diferentes formatos de ID
    const paymentIds = [
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString()
    ];
    
    for (const id of paymentIds) {
      const verifyData = {
        ...validVerifyData,
        paymentId: id
      };
      
      const [error, verifyPaymentDto] = VerifyPaymentDto.create(verifyData);
      
      expect(error).toBeUndefined();
      expect(verifyPaymentDto?.paymentId).toBe(id);
    }
  });

  // Prueba con diferentes formatos de providerPaymentId
  test('should accept different providerPaymentId formats', () => {
    // Diferentes formatos de ID del proveedor
    const providerIds = ['123456789', 'MP-1234-5678', 'payment_12345', '9876543210'];
    
    for (const id of providerIds) {
      const verifyData = {
        ...validVerifyData,
        providerPaymentId: id
      };
      
      const [error, verifyPaymentDto] = VerifyPaymentDto.create(verifyData);
      
      expect(error).toBeUndefined();
      expect(verifyPaymentDto?.providerPaymentId).toBe(id);
    }
  });

  // Prueba con valores límite
  test('should handle edge cases', () => {
    // Caso extremo: ID muy largo
    const longId = 'a'.repeat(100);
    const edgeCaseData = {
      paymentId: validPaymentId,
      providerPaymentId: longId
    };
    
    const [error, verifyPaymentDto] = VerifyPaymentDto.create(edgeCaseData);
    
    // Suponemos que un ID muy largo es válido (no hay límite especificado)
    expect(error).toBeUndefined();
    expect(verifyPaymentDto?.providerPaymentId).toBe(longId);
  });
});