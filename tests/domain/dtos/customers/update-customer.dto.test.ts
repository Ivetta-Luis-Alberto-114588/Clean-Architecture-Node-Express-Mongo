import { UpdateCustomerDto } from '../../../../src/domain/dtos/customers/update-customer.dto';
import mongoose from 'mongoose';

describe('UpdateCustomerDto', () => {
  // ID válido para pruebas
  const validNeighborhoodId = new mongoose.Types.ObjectId().toString();
  
  // Prueba de actualización exitosa con todos los campos
  test('should create a valid DTO with all fields', () => {
    // Datos de prueba válidos con todos los campos
    const updateData = {
      name: 'Juan Pérez Updated',
      email: 'juan.perez.updated@example.com',
      phone: '+5491198765432',
      address: 'Av. Rivadavia 5678',
      neighborhoodId: validNeighborhoodId,
      isActive: false
    };
    
    // Creación del DTO
    const [error, updateCustomerDto] = UpdateCustomerDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCustomerDto).toBeInstanceOf(UpdateCustomerDto);
    
    // Verificar campos proporcionados
    expect(updateCustomerDto?.name).toBe('juan pérez updated');
    expect(updateCustomerDto?.email).toBe('juan.perez.updated@example.com');
    expect(updateCustomerDto?.phone).toBe('+5491198765432');
    expect(updateCustomerDto?.address).toBe('av. rivadavia 5678');
    expect(updateCustomerDto?.neighborhoodId).toBe(validNeighborhoodId);
    expect(updateCustomerDto?.isActive).toBe(false);
  });
  
  // Prueba de validación: objeto vacío
  test('should return error if no update fields are provided', () => {
    // Datos de prueba vacíos
    const updateData = {};
    
    // Creación del DTO
    const [error, updateCustomerDto] = UpdateCustomerDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
    expect(updateCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: nombre demasiado corto
  test('should return error if name is too short', () => {
    // Datos de prueba con nombre demasiado corto
    const updateData = {
      name: 'J' // menos de 2 caracteres
    };
    
    // Creación del DTO
    const [error, updateCustomerDto] = UpdateCustomerDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('El nombre debe tener al menos 2 caracteres');
    expect(updateCustomerDto).toBeUndefined();
  });
  
  // Prueba de validación: formato de email
  test('should return error if email format is invalid', () => {
    // Datos de prueba con email de formato inválido
    const updateData = {
      email: 'invalid-email' // formato inválido
    };
    
    // Creación del DTO
    const [error, updateCustomerDto] = UpdateCustomerDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('El formato del email no es válido');
    expect(updateCustomerDto).toBeUndefined();
  });
  
  // Prueba de actualización exitosa con solo algunos campos
  test('should create a valid DTO with name only', () => {
    // Datos de prueba con solo nombre
    const updateData = {
      name: 'Juan Pérez Updated'
    };
    
    // Creación del DTO
    const [error, updateCustomerDto] = UpdateCustomerDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCustomerDto).toBeInstanceOf(UpdateCustomerDto);
    expect(updateCustomerDto?.name).toBe('juan pérez updated');
    expect(updateCustomerDto?.email).toBeUndefined();
    expect(updateCustomerDto?.phone).toBeUndefined();
    expect(updateCustomerDto?.address).toBeUndefined();
    expect(updateCustomerDto?.neighborhoodId).toBeUndefined();
    expect(updateCustomerDto?.isActive).toBeUndefined();
  });
  
  test('should create a valid DTO with email only', () => {
    // Datos de prueba con solo email
    const updateData = {
      email: 'juan.nuevo@example.com'
    };
    
    // Creación del DTO
    const [error, updateCustomerDto] = UpdateCustomerDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCustomerDto).toBeInstanceOf(UpdateCustomerDto);
    expect(updateCustomerDto?.name).toBeUndefined();
    expect(updateCustomerDto?.email).toBe('juan.nuevo@example.com');
  });
});