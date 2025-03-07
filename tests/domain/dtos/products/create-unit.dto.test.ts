// tests/domain/dtos/products/create-unit.dto.test.ts

import { CreateUnitDto } from '../../../../src/domain/dtos/products/create-unit.dto';

describe('CreateUnitDto', () => {
  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Datos de prueba válidos
    const unitData = {
      name: 'Test Unit',
      description: 'Test unit description',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createUnitDto).toBeInstanceOf(CreateUnitDto);
    
    // Verificar valores correctos y transformaciones
    expect(createUnitDto?.name).toBe('test unit'); // debe estar en minúsculas
    expect(createUnitDto?.description).toBe('test unit description'); // debe estar en minúsculas
    expect(createUnitDto?.isActive).toBe(true);
  });
  
  // Prueba de validación: nombre requerido
  test('should return error if name is not provided', () => {
    // Datos de prueba con nombre faltante
    const unitData = {
      description: 'Test unit description',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBe('name is required');
    expect(createUnitDto).toBeUndefined();
  });
  
  // Prueba de validación: descripción requerida
  test('should return error if description is not provided', () => {
    // Datos de prueba con descripción faltante
    const unitData = {
      name: 'Test Unit',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBe('description is required');
    expect(createUnitDto).toBeUndefined();
  });
  
  // Prueba de validación: isActive requerido
  test('should return error if isActive is not provided', () => {
    // Datos de prueba con isActive faltante
    const unitData = {
      name: 'Test Unit',
      description: 'Test unit description'
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBe('isActive is required');
    expect(createUnitDto).toBeUndefined();
  });
  
  // Prueba de validación: valor vacío para nombre
  test('should return error for empty name', () => {
    // Datos de prueba con nombre vacío
    const unitData = {
      name: '',
      description: 'Test unit description',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBe('name is required');
    expect(createUnitDto).toBeUndefined();
  });
  
  // Prueba de validación: valor vacío para descripción
  test('should return error for empty description', () => {
    // Datos de prueba con descripción vacía
    const unitData = {
      name: 'Test Unit',
      description: '',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBe('description is required');
    expect(createUnitDto).toBeUndefined();
  });
  
  // Prueba de valores no booleanos para isActive
  test('should handle non-boolean isActive values', () => {
    // Datos de prueba con isActive no booleano
    const unitData = {
      name: 'Test Unit',
      description: 'Test unit description',
      isActive: 'yes' // no es un booleano
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor booleano');
    expect(createUnitDto).toBeUndefined();
  });
  
  // Prueba de transformaciones de texto
  test('should convert name and description to lowercase', () => {
    // Datos de prueba con texto en mayúsculas
    const unitData = {
      name: 'TEST UNIT',
      description: 'TEST UNIT DESCRIPTION',
      isActive: true
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createUnitDto).toBeInstanceOf(CreateUnitDto);
    expect(createUnitDto?.name).toBe('test unit');
    expect(createUnitDto?.description).toBe('test unit description');
  });
  
  // Prueba de creación con valor booleano false para isActive
  test('should create a valid DTO with isActive set to false', () => {
    // Datos de prueba con isActive = false
    const unitData = {
      name: 'Test Unit',
      description: 'Test unit description',
      isActive: false
    };
    
    // Creación del DTO
    const [error, createUnitDto] = CreateUnitDto.create(unitData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(createUnitDto).toBeInstanceOf(CreateUnitDto);
    expect(createUnitDto?.isActive).toBe(false);
  });
});