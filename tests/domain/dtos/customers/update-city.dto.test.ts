import { UpdateCityDto } from '../../../../src/domain/dtos/customers/update-city.dto';

describe('UpdateCityDto', () => {
  // Prueba de actualización exitosa con todos los campos
  test('should create a valid DTO with all fields', () => {
    // Datos de prueba válidos
    const updateData = {
      name: 'Buenos Aires Updated',
      description: 'Capital Federal',
      isActive: false
    };
    
    // Creación del DTO
    const [error, updateCityDto] = UpdateCityDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCityDto).toBeInstanceOf(UpdateCityDto);
    
    // Verificar valores correctos y transformaciones
    expect(updateCityDto?.name).toBe('buenos aires updated'); // debe estar en minúsculas
    expect(updateCityDto?.description).toBe('capital federal'); // debe estar en minúsculas
    expect(updateCityDto?.isActive).toBe(false);
  });
  
  // Prueba de actualización exitosa con solo algunos campos
  test('should create a valid DTO with partial fields', () => {
    // Datos de prueba con solo algunos campos
    const updateData = {
      name: 'Buenos Aires Updated'
    };
    
    // Creación del DTO
    const [error, updateCityDto] = UpdateCityDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCityDto).toBeInstanceOf(UpdateCityDto);
    
    // Verificar valores correctos y transformaciones
    expect(updateCityDto?.name).toBe('buenos aires updated'); // debe estar en minúsculas
    expect(updateCityDto?.description).toBeUndefined(); // no se proporcionó
    expect(updateCityDto?.isActive).toBeUndefined(); // no se proporcionó
  });
  
  // Prueba de validación: objeto vacío
  test('should return error if no update fields are provided', () => {
    // Datos de prueba vacíos
    const updateData = {};
    
    // Creación del DTO
    const [error, updateCityDto] = UpdateCityDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
    expect(updateCityDto).toBeUndefined();
  });
  
  // Prueba de validación: longitud mínima del nombre
  test('should return error if name is too short', () => {
    // Datos de prueba con nombre demasiado corto
    const updateData = {
      name: 'BA' // menos de 3 caracteres
    };
    
    // Creación del DTO
    const [error, updateCityDto] = UpdateCityDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('El nombre debe tener al menos 3 caracteres');
    expect(updateCityDto).toBeUndefined();
  });
  
  // Prueba de validación: isActive debe ser booleano
  test('should return error if isActive is not a boolean', () => {
    // Datos de prueba con isActive no booleano
    const updateData = {
      isActive: 'true' // string en lugar de boolean
    };
    
    // Creación del DTO
    const [error, updateCityDto] = UpdateCityDto.update(updateData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor booleano');
    expect(updateCityDto).toBeUndefined();
  });
  
  // Prueba de múltiples campos con uno inválido
  test('should validate all fields even when multiple are provided', () => {
    // Datos de prueba con un campo inválido
    const updateData = {
      name: 'Buenos Aires Updated',
      description: 'Capital Federal',
      isActive: 'invalid' // no es booleano
    };
    
    // Creación del DTO
    const [error, updateCityDto] = UpdateCityDto.update(updateData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor booleano');
    expect(updateCityDto).toBeUndefined();
  });
});