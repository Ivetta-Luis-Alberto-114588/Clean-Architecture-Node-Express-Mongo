import { UpdateCategoryDto } from '../../../../src/domain/dtos/products/update-category.dto';

describe('UpdateCategoryDto', () => {
  // Prueba de actualización exitosa con todos los campos
  test('should create a valid DTO with all fields', () => {
    // Datos de prueba válidos
    const updateData = {
      name: 'Updated Category',
      description: 'Updated category description',
      isActive: false
    };
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCategoryDto).toBeInstanceOf(UpdateCategoryDto);
    
    // Verificar valores correctos y transformaciones
    expect(updateCategoryDto?.name).toBe('updated category'); // debe estar en minúsculas
    expect(updateCategoryDto?.description).toBe('updated category description'); // debe estar en minúsculas
    expect(updateCategoryDto?.isActive).toBe(false);
  });
  
  // Prueba de actualización exitosa con solo el nombre
  test('should create a valid DTO with only name field', () => {
    // Datos de prueba con solo nombre
    const updateData = {
      name: 'Updated Category Name'
    };
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCategoryDto).toBeInstanceOf(UpdateCategoryDto);
    
    // Verificar valores
    expect(updateCategoryDto?.name).toBe('updated category name');
    expect(updateCategoryDto?.description).toBeUndefined();
    expect(updateCategoryDto?.isActive).toBeUndefined();
  });
  
  // Prueba de actualización exitosa con solo la descripción
  test('should create a valid DTO with only description field', () => {
    // Datos de prueba con solo descripción
    const updateData = {
      description: 'Updated category description only'
    };
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCategoryDto).toBeInstanceOf(UpdateCategoryDto);
    
    // Verificar valores
    expect(updateCategoryDto?.name).toBeUndefined();
    expect(updateCategoryDto?.description).toBe('updated category description only');
    expect(updateCategoryDto?.isActive).toBeUndefined();
  });
  
  // Prueba de actualización exitosa con solo isActive
  test('should create a valid DTO with only isActive field', () => {
    // Datos de prueba con solo isActive
    const updateData = {
      isActive: false
    };
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateCategoryDto).toBeInstanceOf(UpdateCategoryDto);
    
    // Verificar valores
    expect(updateCategoryDto?.name).toBeUndefined();
    expect(updateCategoryDto?.description).toBeUndefined();
    expect(updateCategoryDto?.isActive).toBe(false);
  });
  
  // Prueba de validación: objeto vacío
  test('should return error if no update fields are provided', () => {
    // Datos de prueba vacíos
    const updateData = {};
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
    expect(updateCategoryDto).toBeUndefined();
  });
  
  // Prueba de validación: nombre muy corto
  test('should return error if name is too short', () => {
    // Datos de prueba con nombre demasiado corto
    const updateData = {
      name: 'A' // supongamos que requiere al menos 2 caracteres
    };
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('El nombre debe tener al menos 2 caracteres');
    expect(updateCategoryDto).toBeUndefined();
  });
  
  // Prueba de validación: isActive debe ser booleano
  test('should return error if isActive is not a boolean', () => {
    // Datos de prueba con isActive no booleano
    const updateData = {
      isActive: 'true' // string en lugar de boolean
    };
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor booleano');
    expect(updateCategoryDto).toBeUndefined();
  });
  
  // Prueba de múltiples campos con uno inválido
  test('should validate all fields even when multiple are provided', () => {
    // Datos de prueba con un campo inválido
    const updateData = {
      name: 'Valid Name',
      description: 'Valid description',
      isActive: 'invalid' // no es booleano
    };
    
    // Creación del DTO
    const [error, updateCategoryDto] = UpdateCategoryDto.update(updateData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor booleano');
    expect(updateCategoryDto).toBeUndefined();
  });
});