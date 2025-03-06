// tests/domain/dtos/payment/create-payment.dto.test.ts
import { CreatePaymentDto } from '../../../../src/domain/dtos/payment/create-payment.dto';
import { PaymentMethod, PaymentProvider } from '../../../../src/domain/entities/payment/payment.entity';
import { MercadoPagoItem, MercadoPagoPayer } from '../../../../src/domain/interfaces/payment/mercado-pago.interface';
import mongoose from 'mongoose';

describe('CreatePaymentDto', () => {
  // ID válido para pruebas
  const validSaleId = new mongoose.Types.ObjectId().toString();
  const validCustomerId = new mongoose.Types.ObjectId().toString();

  // Datos válidos para las pruebas
  const validItems: MercadoPagoItem[] = [
    {
      id: '1',
      title: 'Test Item',
      description: 'Test Description',
      quantity: 1,
      unit_price: 100
    }
  ];

  const validPayer: MercadoPagoPayer = {
    name: 'Test',
    surname: 'User',
    email: 'test@example.com',
    phone: {
      area_code: '123',
      number: '4567890'
    },
    identification: {
      type: 'DNI',
      number: '12345678'
    }
  };

  const validBackUrls = {
    success: 'http://example.com/success',
    failure: 'http://example.com/failure',
    pending: 'http://example.com/pending'
  };

  const validNotificationUrl = 'http://example.com/notification';

  // Datos completos de pago válidos
  const validPaymentData = {
    saleId: validSaleId,
    customerId: validCustomerId,
    amount: 100,
    provider: PaymentProvider.MERCADO_PAGO,
    items: validItems,
    payer: validPayer,
    backUrls: validBackUrls,
    notificationUrl: validNotificationUrl
  };

  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Creación del DTO
    const [error, createPaymentDto] = CreatePaymentDto.create(validPaymentData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createPaymentDto).toBeInstanceOf(CreatePaymentDto);
    
    // Verificar valores
    expect(createPaymentDto?.saleId).toBe(validSaleId);
    expect(createPaymentDto?.customerId).toBe(validCustomerId);
    expect(createPaymentDto?.amount).toBe(100);
    expect(createPaymentDto?.provider).toBe(PaymentProvider.MERCADO_PAGO);
    expect(createPaymentDto?.items).toEqual(validItems);
    expect(createPaymentDto?.payer).toEqual(validPayer);
    expect(createPaymentDto?.backUrls).toEqual(validBackUrls);
    expect(createPaymentDto?.notificationUrl).toBe(validNotificationUrl);
    expect(createPaymentDto?.externalReference).toBe(`sale-${validSaleId}`);
    expect(createPaymentDto?.idempotencyKey).toBeDefined();
  });

  // Prueba de validación: saleId requerido
  test('should return error if saleId is not provided', () => {
    const invalidData = { ...validPaymentData, saleId: undefined };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('saleId es requerido');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: customerId requerido
  test('should return error if customerId is not provided', () => {
    const invalidData = { ...validPaymentData, customerId: undefined };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('customerId es requerido');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: amount debe ser positivo
  test('should return error if amount is not positive', () => {
    const invalidData = { ...validPaymentData, amount: 0 };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('amount debe ser mayor a 0');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: items es requerido
  test('should return error if items is not provided', () => {
    const invalidData = { ...validPaymentData, items: undefined };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('items debe ser un array no vacío');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: items vacío
  test('should return error if items is empty array', () => {
    const invalidData = { ...validPaymentData, items: [] };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('items debe ser un array no vacío');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: payer es requerido
  test('should return error if payer is not provided', () => {
    const invalidData = { ...validPaymentData, payer: undefined };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('payer es requerido');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: email del payer es requerido
  test('should return error if payer email is not provided', () => {
    const invalidPayer = { ...validPayer, email: undefined };
    const invalidData = { ...validPaymentData, payer: invalidPayer };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('email del pagador es requerido');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: backUrls es requerido
  test('should return error if backUrls is not provided', () => {
    const invalidData = { ...validPaymentData, backUrls: undefined };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('backUrls es requerido');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: backUrl success es requerido
  test('should return error if backUrl success is not provided', () => {
    const invalidBackUrls = { ...validBackUrls, success: undefined };
    const invalidData = { ...validPaymentData, backUrls: invalidBackUrls };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('backUrl de éxito es requerida');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: backUrl failure es requerido
  test('should return error if backUrl failure is not provided', () => {
    const invalidBackUrls = { ...validBackUrls, failure: undefined };
    const invalidData = { ...validPaymentData, backUrls: invalidBackUrls };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('backUrl de fallo es requerida');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: backUrl pending es requerido
  test('should return error if backUrl pending is not provided', () => {
    const invalidBackUrls = { ...validBackUrls, pending: undefined };
    const invalidData = { ...validPaymentData, backUrls: invalidBackUrls };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('backUrl de pendiente es requerida');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: notificationUrl es requerido
  test('should return error if notificationUrl is not provided', () => {
    const invalidData = { ...validPaymentData, notificationUrl: undefined };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('notificationUrl es requerida');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: id del item es requerido
  test('should return error if item id is not provided', () => {
    const invalidItems = [{ ...validItems[0], id: undefined }];
    const invalidData = { ...validPaymentData, items: invalidItems };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('id del item es requerido');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: title del item es requerido
  test('should return error if item title is not provided', () => {
    const invalidItems = [{ ...validItems[0], title: undefined }];
    const invalidData = { ...validPaymentData, items: invalidItems };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('title del item es requerido');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: quantity del item debe ser positivo
  test('should return error if item quantity is not positive', () => {
    const invalidItems = [{ ...validItems[0], quantity: 0 }];
    const invalidData = { ...validPaymentData, items: invalidItems };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('quantity del item debe ser mayor a 0');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba de validación: unit_price del item debe ser positivo
  test('should return error if item unit_price is not positive', () => {
    const invalidItems = [{ ...validItems[0], unit_price: 0 }];
    const invalidData = { ...validPaymentData, items: invalidItems };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(invalidData);
    
    expect(error).toBe('unit_price del item debe ser mayor a 0');
    expect(createPaymentDto).toBeUndefined();
  });

  // Prueba para verificar que se genera un idempotencyKey por defecto
  test('should generate idempotencyKey if not provided', () => {
    const [error, createPaymentDto] = CreatePaymentDto.create(validPaymentData);
    
    expect(error).toBeUndefined();
    expect(createPaymentDto?.idempotencyKey).toBeDefined();
    expect(createPaymentDto?.idempotencyKey).toContain('payment-' + validSaleId);
  });

  // Prueba para verificar que se respeta el idempotencyKey si se proporciona
  test('should use provided idempotencyKey', () => {
    const customIdempotencyKey = 'custom-key-123';
    const dataWithIdempotencyKey = { 
      ...validPaymentData, 
      idempotencyKey: customIdempotencyKey 
    };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(dataWithIdempotencyKey);
    
    expect(error).toBeUndefined();
    expect(createPaymentDto?.idempotencyKey).toBe(customIdempotencyKey);
  });

  // Prueba para verificar que se genera un externalReference por defecto
  test('should generate externalReference if not provided', () => {
    const [error, createPaymentDto] = CreatePaymentDto.create(validPaymentData);
    
    expect(error).toBeUndefined();
    expect(createPaymentDto?.externalReference).toBe(`sale-${validSaleId}`);
  });

  // Prueba para verificar que se respeta el externalReference si se proporciona
  test('should use provided externalReference', () => {
    const customExternalReference = 'custom-ref-123';
    const dataWithExternalReference = { 
      ...validPaymentData, 
      externalReference: customExternalReference 
    };
    
    const [error, createPaymentDto] = CreatePaymentDto.create(dataWithExternalReference);
    
    expect(error).toBeUndefined();
    expect(createPaymentDto?.externalReference).toBe(customExternalReference);
  });
});