// tests/domain/dtos/products/update-unit.dto.test.ts
import { UpdateUnitDto } from '../../../../src/domain/dtos/products/udpate-unit.dto';

describe('UpdateUnitDto', () => {
  // Prueba de actualización exitosa con todos los campos
  test('should create a valid DTO with all fields', () => {
    // Datos de prueba válidos
    const updateData = {
      name: 'Updated Unit',
      description: 'Updated unit description',
      isActive: false
    };
    
    // Creación del DTO
    const [error, updateUnitDto] = UpdateUnitDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateUnitDto).toBeInstanceOf(UpdateUnitDto);
    
    // Verificar valores correctos
    expect(updateUnitDto?.name).toBe('updated unit');
    expect(updateUnitDto?.description).toBe('updated unit description');
    expect(updateUnitDto?.isActive).toBe(false);
  });
  
  // Prueba de actualización exitosa con solo algunos campos
  test('should create a valid DTO with partial fields', () => {
    // Datos de prueba con solo nombre
    const updateData = {
      name: 'Updated Unit Name'
    };
    
    // Creación del DTO
    const [error, updateUnitDto] = UpdateUnitDto.update(updateData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(updateUnitDto).toBeInstanceOf(UpdateUnitDto);
    
    // Verificar valores correctos
    expect(updateUnitDto?.name).toBe('updated unit name');
    expect(updateUnitDto?.description).toBeUndefined();
    expect(updateUnitDto?.isActive).toBeUndefined();
  });
  
  // Prueba de validación: objeto vacío
  test('should return error if no update fields are provided', () => {
    // Datos de prueba vacíos
    const updateData = {};
    
    // Creación del DTO
    const [error, updateUnitDto] = UpdateUnitDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
    expect(updateUnitDto).toBeUndefined();
  });
  
  // Prueba de validación: nombre muy corto
  test('should return error if name is too short', () => {
    // Datos de prueba con nombre demasiado corto
    const updateData = {
      name: 'U' // supongamos que requiere al menos 2 caracteres
    };
    
    // Creación del DTO
    const [error, updateUnitDto] = UpdateUnitDto.update(updateData);
    
    // Verificaciones
    expect(error).toBe('El nombre debe tener al menos 2 caracteres');
    expect(updateUnitDto).toBeUndefined();
  });
  
  // Prueba de validación: isActive debe ser booleano
  test('should return error if isActive is not a boolean', () => {
    // Datos de prueba con isActive no booleano
    const updateData = {
      isActive: 'true' // string en lugar de boolean
    };
    
    // Creación del DTO
    const [error, updateUnitDto] = UpdateUnitDto.update(updateData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor booleano');
    expect(updateUnitDto).toBeUndefined();
  });
  
  // Prueba con diferentes combinaciones de campos
  test('should accept different field combinations', () => {
    // Prueba con solo descripción
    const [error1, updateUnitDto1] = UpdateUnitDto.update({
      description: 'Only description update'
    });
    expect(error1).toBeUndefined();
    expect(updateUnitDto1?.description).toBe('only description update');
    expect(updateUnitDto1?.name).toBeUndefined();
    expect(updateUnitDto1?.isActive).toBeUndefined();
    
    // Prueba con solo isActive
    const [error2, updateUnitDto2] = UpdateUnitDto.update({
      isActive: true
    });
    expect(error2).toBeUndefined();
    expect(updateUnitDto2?.isActive).toBe(true);
    expect(updateUnitDto2?.name).toBeUndefined();
    expect(updateUnitDto2?.description).toBeUndefined();
    
    // Prueba con nombre y isActive
    const [error3, updateUnitDto3] = UpdateUnitDto.update({
      name: 'New Name',
      isActive: false
    });
    expect(error3).toBeUndefined();
    expect(updateUnitDto3?.name).toBe('new name');
    expect(updateUnitDto3?.isActive).toBe(false);
    expect(updateUnitDto3?.description).toBeUndefined();
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
    const [error, updateUnitDto] = UpdateUnitDto.update(updateData as any);
    
    // Verificaciones
    expect(error).toBe('isActive debe ser un valor booleano');
    expect(updateUnitDto).toBeUndefined();
  });
});