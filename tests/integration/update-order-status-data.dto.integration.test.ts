import { UpdateOrderStatusDataDto } from '../../src/domain/dtos/order/update-order-status-data.dto';

describe('UpdateOrderStatusDataDto Integration', () => {
    it('should create a valid DTO with all fields', () => {
        const props = {
            code: 'ENVIADO',
            name: 'Enviado',
            description: 'Pedido enviado al cliente',
            color: '#FF0000',
            order: 2,
            isActive: true,
            isDefault: false,
            canTransitionTo: ['DELIVERED', 'CANCELLED']
        };
        const [error, dto] = UpdateOrderStatusDataDto.update(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.code).toBe('ENVIADO');
        expect(dto!.name).toBe('Enviado');
        expect(dto!.description).toBe('Pedido enviado al cliente');
        expect(dto!.color).toBe('#FF0000');
        expect(dto!.order).toBe(2);
        expect(dto!.isActive).toBe(true);
        expect(dto!.isDefault).toBe(false);
        expect(dto!.canTransitionTo).toEqual(['DELIVERED', 'CANCELLED']);
    });

    it('should return error if code is too short', () => {
        const [error, dto] = UpdateOrderStatusDataDto.update({ code: 'A' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if name is too short', () => {
        const [error, dto] = UpdateOrderStatusDataDto.update({ name: 'A' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if description is too short', () => {
        const [error, dto] = UpdateOrderStatusDataDto.update({ description: '1234' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if color is not hex', () => {
        const [error, dto] = UpdateOrderStatusDataDto.update({ color: 'red' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if order is negative', () => {
        const [error, dto] = UpdateOrderStatusDataDto.update({ order: -1 });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should accept allowedTransitions as alternative to canTransitionTo', () => {
        const props = {
            allowedTransitions: ['DELIVERED', 'CANCELLED']
        };
        const [error, dto] = UpdateOrderStatusDataDto.update(props);
        expect(error).toBeUndefined();
        expect(dto!.canTransitionTo).toEqual(['DELIVERED', 'CANCELLED']);
    });

    it('should return error if canTransitionTo contains invalid value', () => {
        const props = {
            canTransitionTo: ['']
        };
        const [error, dto] = UpdateOrderStatusDataDto.update(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if canTransitionTo contains short code', () => {
        const props = {
            canTransitionTo: ['A']
        };
        const [error, dto] = UpdateOrderStatusDataDto.update(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });
});
