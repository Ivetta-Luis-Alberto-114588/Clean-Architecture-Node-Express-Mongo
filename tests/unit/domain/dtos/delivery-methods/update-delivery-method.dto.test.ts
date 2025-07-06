// tests/unit/domain/dtos/delivery-methods/update-delivery-method.dto.test.ts

import { UpdateDeliveryMethodDto } from '../../../../../src/domain/dtos/delivery-methods/update-delivery-method.dto';

describe('UpdateDeliveryMethodDto', () => {
  describe('update', () => {
    it('should create valid DTO when all fields are provided', () => {
      const validData = {
        code: 'EXPRESS_UPDATED',
        name: 'Envío Express Actualizado',
        description: 'Entrega en 12 horas',
        requiresAddress: false,
        isActive: false
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(validData);

      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.code).toBe('EXPRESS_UPDATED');
      expect(dto!.name).toBe('Envío Express Actualizado');
      expect(dto!.description).toBe('Entrega en 12 horas');
      expect(dto!.requiresAddress).toBe(validData.requiresAddress);
      expect(dto!.isActive).toBe(validData.isActive);
    });

    it('should create valid DTO when only some fields are provided', () => {
      const validData = {
        name: 'Nuevo Nombre',
        isActive: false
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(validData);

      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.name).toBe(validData.name);
      expect(dto!.isActive).toBe(validData.isActive);
      expect(dto!.code).toBeUndefined();
      expect(dto!.description).toBeUndefined();
      expect(dto!.requiresAddress).toBeUndefined();
    });

    it('should create valid DTO when no fields are provided', () => {
      const validData = {};

      const [error, dto] = UpdateDeliveryMethodDto.update(validData);

      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
    });

    it('should return error when requiresAddress is not boolean', () => {
      const invalidData = {
        requiresAddress: 'false' // string instead of boolean
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(invalidData);

      expect(error).toBe('RequiresAddress must be a boolean');
      expect(dto).toBeUndefined();
    });

    it('should return error when isActive is not boolean', () => {
      const invalidData = {
        isActive: 'true' // string instead of boolean
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(invalidData);

      expect(error).toBe('IsActive must be a boolean');
      expect(dto).toBeUndefined();
    });

    it('should return error when code is empty string', () => {
      const invalidData = {
        code: '   ' // empty/whitespace string
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(invalidData);

      expect(error).toBe('Code cannot be empty');
      expect(dto).toBeUndefined();
    });

    it('should return error when name is empty string', () => {
      const invalidData = {
        name: '   ' // empty/whitespace string
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(invalidData);

      expect(error).toBe('Name cannot be empty');
      expect(dto).toBeUndefined();
    });

    it('should trim and uppercase code', () => {
      const validData = {
        code: '  express  '
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(validData);

      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.code).toBe('EXPRESS');
    });

    it('should trim name and description', () => {
      const validData = {
        name: '  Test Name  ',
        description: '  Test Description  '
      };

      const [error, dto] = UpdateDeliveryMethodDto.update(validData);

      expect(error).toBeUndefined();
      expect(dto).toBeDefined();
      expect(dto!.name).toBe('Test Name');
      expect(dto!.description).toBe('Test Description');
    });
  });
});
