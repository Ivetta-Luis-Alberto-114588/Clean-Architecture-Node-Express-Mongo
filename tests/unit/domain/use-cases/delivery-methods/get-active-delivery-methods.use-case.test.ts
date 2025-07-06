// tests/unit/domain/use-cases/delivery-methods/get-active-delivery-methods.use-case.test.ts

import { GetActiveDeliveryMethods } from '../../../../../src/domain/use-cases/delivery-methods/get-active-delivery-methods.use-case';
import { DeliveryMethodRepository } from '../../../../../src/domain/repositories/delivery-methods/delivery-method.repository';
import { DeliveryMethodEntity } from '../../../../../src/domain/entities/delivery-methods/delivery-method.entity';
import { PaginationDto } from '../../../../../src/domain/dtos/shared/pagination.dto';

describe('GetActiveDeliveryMethods', () => {
    let useCase: GetActiveDeliveryMethods;
    let mockRepository: jest.Mocked<DeliveryMethodRepository>;

    beforeEach(() => {
        mockRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            getAll: jest.fn(),
            getActiveOnes: jest.fn(),
            updateById: jest.fn(),
            deleteById: jest.fn()
        };

        useCase = new GetActiveDeliveryMethods(mockRepository);
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

            mockRepository.getActiveOnes.mockResolvedValue(mockDeliveryMethods);

            // Act
            const result = await useCase.execute();

            // Assert
            expect(result).toEqual(mockDeliveryMethods);
            expect(mockRepository.getActiveOnes).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(2);
            expect(result[0].isActive).toBe(true);
            expect(result[1].isActive).toBe(true);
        });

        it('should return empty array when no active delivery methods exist', async () => {
            // Arrange
            mockRepository.getActiveOnes.mockResolvedValue([]);

            // Act
            const result = await useCase.execute();

            // Assert
            expect(result).toEqual([]);
            expect(mockRepository.getActiveOnes).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(0);
        });

        it('should throw error when repository throws error', async () => {
            // Arrange
            const error = new Error('Database connection error');
            mockRepository.getActiveOnes.mockRejectedValue(error);

            // Act & Assert
            await expect(useCase.execute()).rejects.toThrow('Database connection error');
            expect(mockRepository.getActiveOnes).toHaveBeenCalledTimes(1);
        });

        it('should call repository getActiveOnes method exactly once', async () => {
            // Arrange
            mockRepository.getActiveOnes.mockResolvedValue([]);

            // Act
            await useCase.execute();

            // Assert
            expect(mockRepository.getActiveOnes).toHaveBeenCalledTimes(1);
            expect(mockRepository.getActiveOnes).toHaveBeenCalledWith();
        });
    });
});
