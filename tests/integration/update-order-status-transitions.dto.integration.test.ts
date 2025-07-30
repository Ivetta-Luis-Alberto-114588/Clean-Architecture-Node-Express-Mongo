import { UpdateOrderStatusTransitionsDto } from '../../src/domain/dtos/order/update-order-status-transitions.dto';

describe('UpdateOrderStatusTransitionsDto Integration', () => {
    it('should create a valid DTO with valid transitions', () => {
        const props = {
            canTransitionTo: ['DELIVERED', 'CANCELLED']
        };
        const [error, dto] = UpdateOrderStatusTransitionsDto.create(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.canTransitionTo).toEqual(['DELIVERED', 'CANCELLED']);
    });

    it('should return error if canTransitionTo is not array', () => {
        const [error, dto] = UpdateOrderStatusTransitionsDto.create({ canTransitionTo: 'DELIVERED' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if canTransitionTo contains invalid value', () => {
        const [error, dto] = UpdateOrderStatusTransitionsDto.create({ canTransitionTo: [''] });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });
});
