// tests/domain/dtos/sales/create-sale.dto.test.ts
import { CreateSaleDto } from '../../../../src/domain/dtos/sales/create-sale.dto';
import mongoose from 'mongoose';

describe('CreateSaleDto', () => {
  // ID válido para pruebas
  const validCustomerId = new mongoose.Types.ObjectId().toString();
  const validProductId = new mongoose.Types.ObjectId().toString();
  
  // Datos válidos para las pruebas
  const validSaleData = {
    customerId: validCustomerId,
    items: [
      {
        productId: validProductId,
        quantity: 2,
        unitPrice: 100
      }
    ],
    taxRate: 21,
    discountRate: 5,
    notes: "Orden de prueba"
  };

  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(validSaleData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createSaleDto).toBeInstanceOf(CreateSaleDto);
    
    // Verificar valores
    expect(createSaleDto?.customerId).toBe(validCustomerId);
    expect(createSaleDto?.items).toEqual(validSaleData.items);
    expect(createSaleDto?.taxRate).toBe(21);
    expect(createSaleDto?.discountRate).toBe(5);
    expect(createSaleDto?.notes).toBe("Orden de prueba");
  });

  // Prueba de validación: customerId requerido
  test('should return error if customerId is not provided', () => {
    // Datos inválidos (sin customerId)
    const invalidData = {
      ...validSaleData,
      customerId: undefined
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("customerId es requerido");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: formato de customerId
  test('should return error if customerId has invalid format', () => {
    // Datos inválidos (formato de ID incorrecto)
    const invalidData = {
      ...validSaleData,
      customerId: 'invalid-id-format'
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("customerId debe ser un id válido para MongoDB");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: items requerido
  test('should return error if items array is not provided', () => {
    // Datos inválidos (sin items)
    const invalidData = {
      customerId: validCustomerId,
      taxRate: 21,
      discountRate: 5
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("items debe ser un array no vacío");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: items vacío
  test('should return error if items array is empty', () => {
    // Datos inválidos (array de items vacío)
    const invalidData = {
      ...validSaleData,
      items: []
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("items debe ser un array no vacío");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: productId requerido en items
  test('should return error if productId is missing in an item', () => {
    // Datos inválidos (item sin productId)
    const invalidData = {
      ...validSaleData,
      items: [
        {
          quantity: 2,
          unitPrice: 100
        }
      ]
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("productId es requerido para cada item");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: formato de productId
  test('should return error if productId has invalid format', () => {
    // Datos inválidos (formato de ID de producto incorrecto)
    const invalidData = {
      ...validSaleData,
      items: [
        {
          productId: 'invalid-product-id',
          quantity: 2,
          unitPrice: 100
        }
      ]
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("productId debe ser un id válido para MongoDB");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: quantity debe ser positivo
  test('should return error if quantity is not positive', () => {
    // Datos inválidos (cantidad cero)
    const invalidData = {
      ...validSaleData,
      items: [
        {
          productId: validProductId,
          quantity: 0,
          unitPrice: 100
        }
      ]
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("quantity debe ser un número mayor a 0");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: unitPrice no puede ser negativo
  test('should return error if unitPrice is negative', () => {
    // Datos inválidos (precio unitario negativo)
    const invalidData = {
      ...validSaleData,
      items: [
        {
          productId: validProductId,
          quantity: 2,
          unitPrice: -10
        }
      ]
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("unitPrice debe ser un número no negativo");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: taxRate debe estar entre 0 y 100
  test('should return error if taxRate is out of range', () => {
    // Datos inválidos (tasa de impuesto fuera de rango)
    const invalidData = {
      ...validSaleData,
      taxRate: 120
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("taxRate debe estar entre 0 y 100");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de validación: discountRate debe estar entre 0 y 100
  test('should return error if discountRate is out of range', () => {
    // Datos inválidos (tasa de descuento fuera de rango)
    const invalidData = {
      ...validSaleData,
      discountRate: 110
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(invalidData);
    
    // Verificaciones
    expect(error).toBe("discountRate debe estar entre 0 y 100");
    expect(createSaleDto).toBeUndefined();
  });

  // Prueba de valores por defecto
  test('should set default values when not provided', () => {
    // Datos mínimos requeridos
    const minimalData = {
      customerId: validCustomerId,
      items: [
        {
          productId: validProductId,
          quantity: 2,
          unitPrice: 100
        }
      ]
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(minimalData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createSaleDto).toBeInstanceOf(CreateSaleDto);
    expect(createSaleDto?.taxRate).toBe(21); // valor por defecto
    expect(createSaleDto?.discountRate).toBe(0); // valor por defecto
    expect(createSaleDto?.notes).toBe(""); // valor por defecto
  });

  // Prueba de múltiples items
  test('should accept multiple items', () => {
    // Datos con múltiples items
    const multiItemsData = {
      customerId: validCustomerId,
      items: [
        {
          productId: validProductId,
          quantity: 2,
          unitPrice: 100
        },
        {
          productId: new mongoose.Types.ObjectId().toString(),
          quantity: 1,
          unitPrice: 50
        }
      ],
      taxRate: 21,
      discountRate: 5
    };
    
    // Creación del DTO
    const [error, createSaleDto] = CreateSaleDto.create(multiItemsData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createSaleDto).toBeInstanceOf(CreateSaleDto);
    expect(createSaleDto?.items.length).toBe(2);
  });
});