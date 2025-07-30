import { CreateOrderStatusDto } from '../../src/domain/dtos/order/create-order-status.dto';
import mongoose from 'mongoose';

describe('CreateOrderStatusDto Integration', () => {
    const validObjectId = new mongoose.Types.ObjectId().toHexString();

    it('should create a valid DTO with all required fields', () => {
        const props = {
            code: 'PE',
            name: 'Pendiente',
            description: 'Pedido pendiente de pago',
            color: '#FF0000',
            order: 1,
            isActive: true,
            isDefault: false,
            canTransitionTo: [validObjectId]
        };
        const [error, dto] = CreateOrderStatusDto.create(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.code).toBe('PE');
        expect(dto!.name).toBe('Pendiente');
        expect(dto!.description).toBe('Pedido pendiente de pago');
        expect(dto!.color).toBe('#FF0000');
        expect(dto!.order).toBe(1);
        expect(dto!.isActive).toBe(true);
        expect(dto!.isDefault).toBe(false);
        expect(dto!.canTransitionTo).toEqual([validObjectId]);
    });

    it('should trim and uppercase code', () => {
        const props = {
            code: ' pe ',
            name: 'Pendiente',
            description: 'Pedido pendiente de pago'
        };
        const [error, dto] = CreateOrderStatusDto.create(props);
        expect(error).toBeUndefined();
        expect(dto!.code).toBe('PE');
    });

    it('should use default values for optional fields', () => {
        const props = {
            code: 'CO',
            name: 'Completado',
            description: 'Pedido completado'
        };
        const [error, dto] = CreateOrderStatusDto.create(props);
        expect(error).toBeUndefined();
        expect(dto!.color).toBe('#6c757d');
        expect(dto!.order).toBe(0);
        expect(dto!.isActive).toBe(true);
        expect(dto!.isDefault).toBe(false);
        expect(dto!.canTransitionTo).toEqual([]);
    });

    it('should return error if code is missing or too short', () => {
        const [error1, dto1] = CreateOrderStatusDto.create({ name: 'n', description: 'desc' });
        expect(error1).toBeDefined();
        expect(dto1).toBeUndefined();
        const [error2, dto2] = CreateOrderStatusDto.create({ code: 'A', name: 'n', description: 'desc' });
        expect(error2).toBeDefined();
        expect(dto2).toBeUndefined();
    });

    it('should return error if name is missing or too short', () => {
        const [error, dto] = CreateOrderStatusDto.create({ code: 'PE', description: 'desc' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
        const [error2, dto2] = CreateOrderStatusDto.create({ code: 'PE', name: 'A', description: 'desc' });
        expect(error2).toBeDefined();
        expect(dto2).toBeUndefined();
    });

    it('should return error if description is missing or too short', () => {
        const [error, dto] = CreateOrderStatusDto.create({ code: 'PE', name: 'Pendiente' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
        const [error2, dto2] = CreateOrderStatusDto.create({ code: 'PE', name: 'Pendiente', description: '1234' });
        expect(error2).toBeDefined();
        expect(dto2).toBeUndefined();
    });

    it('should return error if color is invalid', () => {
        const props = {
            code: 'PE',
            name: 'Pendiente',
            description: 'Pedido pendiente',
            color: 'red'
        };
        const [error, dto] = CreateOrderStatusDto.create(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if canTransitionTo contains invalid ObjectId', () => {
        const props = {
            code: 'PE',
            name: 'Pendiente',
            description: 'Pedido pendiente',
            canTransitionTo: ['invalid-id']
        };
        const [error, dto] = CreateOrderStatusDto.create(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });
});
