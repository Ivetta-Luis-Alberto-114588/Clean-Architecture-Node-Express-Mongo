// tests/unit/domain/use-cases/delivery-methods/get-active-delivery-methods.use-case.test.ts

import { GetActiveDeliveryMethodsUseCase } from '../../../../../src/domain/use-cases/delivery-methods/get-active-delivery-methods.use-case';
import { DeliveryMethodRepository } from '../../../../../src/domain/repositories/delivery-methods/delivery-method.repository';
import { DeliveryMethodEntity } from '../../../../../src/domain/entities/delivery-methods/delivery-method.entity';

describe('GetActiveDeliveryMethodsUseCase', () => {
  let useCase: GetActiveDeliveryMethodsUseCase;
  let mockRepository: jest.Mocked<DeliveryMethodRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    useCase = new GetActiveDeliveryMethodsUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return all active delivery methods', async () => {
      // Arrange
      const mockDeliveryMethods = [
        new DeliveryMethodEntity(
          '1',
          'SHIPPING',
          'Envío a Domicilio',
          'Recibe tu pedido en casa',
          true,
          true
        ),
        new DeliveryMethodEntity(
          '2',
          'PICKUP',
          'Retiro en Local',
          'Retira en nuestra tienda',
          false,
          true
        )
      ];

      mockRepository.findActive.mockResolvedValue(mockDeliveryMethods);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(mockDeliveryMethods);
      expect(mockRepository.findActive).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(true);
    });

    it('should return empty array when no active delivery methods exist', async () => {
      // Arrange
      mockRepository.findActive.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findActive).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(0);
    });

    it('should throw error when repository throws error', async () => {
      // Arrange
      const error = new Error('Database connection error');
      mockRepository.findActive.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Database connection error');
      expect(mockRepository.findActive).toHaveBeenCalledTimes(1);
    });

    it('should call repository findActive method exactly once', async () => {
      // Arrange
      mockRepository.findActive.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(mockRepository.findActive).toHaveBeenCalledTimes(1);
      expect(mockRepository.findActive).toHaveBeenCalledWith();
    });
  });
});
