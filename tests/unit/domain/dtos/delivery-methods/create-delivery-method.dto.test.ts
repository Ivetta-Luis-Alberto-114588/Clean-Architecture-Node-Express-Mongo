// tests/unit/domain/dtos/delivery-methods/create-delivery-method.dto.test.ts

import { CreateDeliveryMethodDto } from '../../../../../src/domain/dtos/delivery-methods/create-delivery-method.dto';

describe('CreateDeliveryMethodDto', () => {
    describe('create', () => {
        it('should create valid DTO when all required fields are provided', () => {
            const validData = {
                code: 'EXPRESS',
                name: 'Envío Express',
                description: 'Entrega en 24 horas',
                requiresAddress: true,
                isActive: true
            };

            const [error, dto] = CreateDeliveryMethodDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.code).toBe(validData.code);
            expect(dto!.name).toBe(validData.name);
            expect(dto!.description).toBe(validData.description);
            expect(dto!.requiresAddress).toBe(validData.requiresAddress);
            expect(dto!.isActive).toBe(validData.isActive);
        });

        it('should create valid DTO with default isActive when not provided', () => {
            const validData = {
                code: 'PICKUP',
                name: 'Retiro en Local',
                description: 'Retirar en la tienda',
                requiresAddress: false
            };

            const [error, dto] = CreateDeliveryMethodDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.isActive).toBe(true);
        });

        it('should return error when code is missing', () => {
            const invalidData = {
                name: 'Test Method',
                description: 'Test description',
                requiresAddress: true
            };

            const [error, dto] = CreateDeliveryMethodDto.create(invalidData);

            expect(error).toBe('Code is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when name is missing', () => {
            const invalidData = {
                code: 'TEST',
                description: 'Test description',
                requiresAddress: true
            };

            const [error, dto] = CreateDeliveryMethodDto.create(invalidData);

            expect(error).toBe('Name is required');
            expect(dto).toBeUndefined();
        });

        it('should create valid DTO when description is missing (optional)', () => {
            const validData = {
                code: 'TEST',
                name: 'Test Method',
                requiresAddress: true
            };

            const [error, dto] = CreateDeliveryMethodDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.description).toBeUndefined();
        });

        it('should return error when requiresAddress is not boolean', () => {
            const invalidData = {
                code: 'TEST',
                name: 'Test Method',
                description: 'Test description',
                requiresAddress: 'true' // string instead of boolean
            };

            const [error, dto] = CreateDeliveryMethodDto.create(invalidData);

            expect(error).toBe('RequiresAddress must be a boolean');
            expect(dto).toBeUndefined();
        });

        it('should create valid DTO when requiresAddress is missing (has default)', () => {
            const validData = {
                code: 'TEST',
                name: 'Test Method',
                description: 'Test description'
            };

            const [error, dto] = CreateDeliveryMethodDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.requiresAddress).toBe(true); // default value
        });
    });
});
