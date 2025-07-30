it('should return error if statusId is missing', () => {
    const props = {
        notes: 'Falta el statusId'
    };
    const [error, dto] = UpdateOrderStatusDto.update(props);
    expect(error).toBeDefined();
    expect(dto).toBeUndefined();
});

it('should return error if statusId is not a valid ObjectId', () => {
    const props = {
        statusId: 'notanobjectid',
        notes: 'StatusId inválido'
    };
    const [error, dto] = UpdateOrderStatusDto.update(props);
    expect(error).toBeDefined();
    expect(dto).toBeUndefined();
});

it('should return error if notes is too long', () => {
    const validObjectId = '60f6c8e2b4d1c72d9c8e4b1a';
    const props = {
        statusId: validObjectId,
        notes: 'a'.repeat(501)
    };
    const [error, dto] = UpdateOrderStatusDto.update(props);
    expect(error).toBeDefined();
    expect(dto).toBeUndefined();
});

it('should create a valid DTO with only statusId (notes optional)', () => {
    const validObjectId = '60f6c8e2b4d1c72d9c8e4b1a';
    const props = {
        statusId: validObjectId
    };
    const [error, dto] = UpdateOrderStatusDto.update(props);
    expect(error).toBeUndefined();
    expect(dto).toBeDefined();
    expect(dto!.statusId).toBe(validObjectId);
    expect(dto!.notes).toBeUndefined();
});
import { UpdateOrderStatusDto } from '../../src/domain/dtos/order/update-order-status.dto';

describe('UpdateOrderStatusDto Integration', () => {
    it('should create a valid DTO with statusId and notes', () => {
        const validObjectId = '60f6c8e2b4d1c72d9c8e4b1a';
        const props = {
            statusId: validObjectId,
            notes: 'Pedido entregado correctamente.'
        };
        const [error, dto] = UpdateOrderStatusDto.update(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.statusId).toBe(validObjectId);
        expect(dto!.notes).toBe('Pedido entregado correctamente.');
    });

    it('should return error if code is too short', () => {
        const [error, dto] = UpdateOrderStatusDto.update({ code: 'A' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if name is too short', () => {
        const [error, dto] = UpdateOrderStatusDto.update({ name: 'A' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if description is too short', () => {
        const [error, dto] = UpdateOrderStatusDto.update({ description: '1234' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if color is not hex', () => {
        const [error, dto] = UpdateOrderStatusDto.update({ color: 'green' });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if order is negative', () => {
        const [error, dto] = UpdateOrderStatusDto.update({ order: -1 });
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });
});
