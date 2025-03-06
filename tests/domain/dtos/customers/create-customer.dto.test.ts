import { CreateCustomerDto } from '../../../../src/domain/dtos/customers/create-customer.dto';
import mongoose from 'mongoose';

describe('CreateCustomerDto', () => {
  // ID válido para pruebas
  const validNeighborhoodId = new mongoose.Types.ObjectId().toString();
  
  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Datos de prueba válidos
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId,
      isActive: true
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createCustomerDto).toBeInstanceOf(CreateCustomerDto);
    
    // Verificar valores correctos y transformaciones
    expect(createCustomerDto?.name).toBe('juan pérez'); // debe estar en minúsculas
    expect(createCustomerDto?.email).toBe('juan.perez@example.com'); // debe estar en minúsculas
    expect(createCustomerDto?.phone).toBe('+5491123456789');
    expect(createCustomerDto?.address).toBe('av. corrientes 1234'); // debe estar en minúsculas
    expect(createCustomerDto?.neighborhoodId).toBe(validNeighborhoodId);
    expect(createCustomerDto?.isActive).toBe(true);
  });
  
  // Prueba de validación: nombre requerido
  test('should return error if name is not provided', () => {
    // Datos de prueba con nombre faltante
    const customerData = {
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('name es requerido');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: longitud mínima del nombre
  test('should return error if name is too short', () => {
    // Datos de prueba con nombre demasiado corto
    const customerData = {
      name: 'JP', // menos de 3 caracteres
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('name debe tener al menos 3 caracteres');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: email requerido
  test('should return error if email is not provided', () => {
    // Datos de prueba con email faltante
    const customerData = {
      name: 'Juan Pérez',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('email es requerido');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: formato de email
  test('should return error if email format is invalid', () => {
    // Datos de prueba con email de formato inválido
    const customerData = {
      name: 'Juan Pérez',
      email: 'invalid-email', // formato inválido
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('email no tiene un formato valido');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: teléfono requerido
  test('should return error if phone is not provided', () => {
    // Datos de prueba con teléfono faltante
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('phone es requerido');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: formato de teléfono
  test('should return error if phone format is invalid', () => {
    // Datos de prueba con teléfono de formato inválido
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '123', // muy corto
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('phone no tiene un formato valido');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: dirección requerida
  test('should return error if address is not provided', () => {
    // Datos de prueba con dirección faltante
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('address es requerido');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: longitud mínima de dirección
  test('should return error if address is too short', () => {
    // Datos de prueba con dirección demasiado corta
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av.', // menos de 5 caracteres
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('address debe tener al menos 4 caracteres');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: neighborhoodId requerido
  test('should return error if neighborhoodId is not provided', () => {
    // Datos de prueba con neighborhoodId faltante
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234'
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('neighborhoodId es requerido');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: formato de neighborhoodId
  test('should return error if neighborhoodId has invalid format', () => {
    // Datos de prueba con neighborhoodId de formato inválido
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: 'invalid-id-format' // ID no válido
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBe('neighborhoodId debe ser un id valido para MongoDB');
    expect(createCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: isActive por defecto
  test('should set isActive to true by default if not provided', () => {
    // Datos de prueba sin isActive
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createCustomerDto).toBeInstanceOf(CreateCustomerDto);
    expect(createCustomerDto?.isActive).toBe(true); // valor por defecto
  });
  
  // Prueba de validación: isActive debe ser booleano
  test('should return error if isActive is not a boolean', () => {
    // Datos de prueba con isActive no booleano
    const customerData = {
      name: 'Juan Pérez',
      email: 'juan.perez@example.com',
      phone: '+5491123456789',
      address: 'Av. Corrientes 1234',
      neighborhoodId: validNeighborhoodId,
      isActive: 'yes' // no es booleano
    };
    
    // Creación del DTO
    const [error, createCustomerDto] = CreateCustomerDto.create(customerData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor boleano');
    expect(createCustomerDto).toBeUndefined();
  });
});