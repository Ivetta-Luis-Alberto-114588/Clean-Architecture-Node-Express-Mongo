import { CreateNeighborhoodDto } from '../../../../src/domain/dtos/customers/create-neighborhood.dto';
import mongoose from 'mongoose';

describe('CreateNeighborhoodDto', () => {
  // ID válido para pruebas
  const validCityId = new mongoose.Types.ObjectId().toString();
  
  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Datos de prueba válidos
    const neighborhoodData = {
      name: 'Palermo',
      description: 'Barrio turístico',
      cityId: validCityId,
      isActive: true
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createNeighborhoodDto).toBeInstanceOf(CreateNeighborhoodDto);
    
    // Verificar valores correctos y transformaciones
    expect(createNeighborhoodDto?.name).toBe('palermo'); // debe estar en minúsculas
    expect(createNeighborhoodDto?.description).toBe('barrio turístico'); // debe estar en minúsculas
    expect(createNeighborhoodDto?.cityId).toBe(validCityId);
    expect(createNeighborhoodDto?.isActive).toBe(true);
  });
  
  // Prueba de validación: nombre requerido
  test('should return error if name is not provided', () => {
    // Datos de prueba con nombre faltante
    const neighborhoodData = {
      description: 'Barrio turístico',
      cityId: validCityId
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData);
    
    // Verificaciones
    expect(error).toBe('name es requiredo');
    expect(createNeighborhoodDto).toBeUndefined();
  });
  
  // Prueba de validación: longitud mínima del nombre
  test('should return error if name is too short', () => {
    // Datos de prueba con nombre demasiado corto
    const neighborhoodData = {
      name: 'Pa', // menos de 3 caracteres
      description: 'Barrio turístico',
      cityId: validCityId
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData);
    
    // Verificaciones
    expect(error).toBe('name debe tener al menos 2 caracteres');
    expect(createNeighborhoodDto).toBeUndefined();
  });
  
  // Prueba de validación: descripción requerida
  test('should return error if description is not provided', () => {
    // Datos de prueba con descripción faltante
    const neighborhoodData = {
      name: 'Palermo',
      cityId: validCityId
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData);
    
    // Verificaciones
    expect(error).toBe('description es requiredo');
    expect(createNeighborhoodDto).toBeUndefined();
  });
  
  // Prueba de validación: cityId requerido
  test('should return error if cityId is not provided', () => {
    // Datos de prueba con cityId faltante
    const neighborhoodData = {
      name: 'Palermo',
      description: 'Barrio turístico'
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData);
    
    // Verificaciones
    expect(error).toBe('cityId es requiredo');
    expect(createNeighborhoodDto).toBeUndefined();
  });
  
  // Prueba de validación: formato de cityId
  test('should return error if cityId has invalid format', () => {
    // Datos de prueba con cityId de formato inválido
    const neighborhoodData = {
      name: 'Palermo',
      description: 'Barrio turístico',
      cityId: 'invalid-id-format' // ID no válido
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData);
    
    // Verificaciones
    expect(error).toBe('cityId debe ser un id valido para MongoDB');
    expect(createNeighborhoodDto).toBeUndefined();
  });
  
  // Prueba de validación: isActive por defecto
  test('should set isActive to true by default if not provided', () => {
    // Datos de prueba sin isActive
    const neighborhoodData = {
      name: 'Palermo',
      description: 'Barrio turístico',
      cityId: validCityId
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createNeighborhoodDto).toBeInstanceOf(CreateNeighborhoodDto);
    expect(createNeighborhoodDto?.isActive).toBe(true); // valor por defecto
  });
  
  // Prueba de validación: isActive debe ser booleano
  test('should return error if isActive is not a boolean', () => {
    // Datos de prueba con isActive no booleano
    const neighborhoodData = {
      name: 'Palermo',
      description: 'Barrio turístico',
      cityId: validCityId,
      isActive: 'yes' // no es booleano
    };
    
    // Creación del DTO
    const [error, createNeighborhoodDto] = CreateNeighborhoodDto.create(neighborhoodData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor boleano');
    expect(createNeighborhoodDto).toBeUndefined();
  });
});