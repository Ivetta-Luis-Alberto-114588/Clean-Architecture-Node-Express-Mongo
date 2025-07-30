import { UpdateOrderDto } from '../../src/domain/dtos/order/update-order.dto';

describe('UpdateOrderDto Integration', () => {
    it('should create a valid DTO with all fields', () => {
        const input = {
            items: [
                { productId: '60f6c8e2b4d1c72d9c8e4b1a', quantity: 2, unitPrice: 100 },
                { productId: '60f6c8e2b4d1c72d9c8e4b1b', quantity: 1, unitPrice: 200 }
            ],
            shippingDetails: {
                recipientName: 'Juan Perez',
                phone: '123456789',
                streetAddress: 'Calle Falsa 123',
                postalCode: '5000',
                neighborhoodId: '60f6c8e2b4d1c72d9c8e4b1c',
                cityId: '60f6c8e2b4d1c72d9c8e4b1d',
                additionalInfo: 'Piso 2'
            },
            notes: 'Por favor entregar rápido',
            couponCode: 'DESCUENTO10'
        };
        const [error, dto] = UpdateOrderDto.create(input);
        expect(error).toBeNull();
        expect(dto).toBeDefined();
        expect(dto!.data.items).toHaveLength(2);
        expect(dto!.data.shippingDetails?.recipientName).toBe('Juan Perez');
        expect(dto!.data.notes).toBe('Por favor entregar rápido');
        expect(dto!.data.couponCode).toBe('DESCUENTO10');
    });

    it('should create a valid DTO with only required fields', () => {
        const input = {};
        const [error, dto] = UpdateOrderDto.create(input);
        expect(error).toBeNull();
        expect(dto).toBeDefined();
        expect(dto!.data.items).toBeUndefined();
        expect(dto!.data.shippingDetails).toBeUndefined();
        expect(dto!.data.notes).toBeUndefined();
        expect(dto!.data.couponCode).toBeNull();
    });

    it('should allow null couponCode', () => {
        const input = { couponCode: null };
        const [error, dto] = UpdateOrderDto.create(input);
        expect(error).toBeNull();
        expect(dto).toBeDefined();
        expect(dto!.data.couponCode).toBeNull();
    });

    it('should allow partial shippingDetails', () => {
        const input = {
            shippingDetails: {
                recipientName: 'Ana',
                cityId: '60f6c8e2b4d1c72d9c8e4b1d'
            }
        };
        const [error, dto] = UpdateOrderDto.create(input);
        expect(error).toBeNull();
        expect(dto).toBeDefined();
        expect(dto!.data.shippingDetails?.recipientName).toBe('Ana');
        expect(dto!.data.shippingDetails?.cityId).toBe('60f6c8e2b4d1c72d9c8e4b1d');
    });

    it('should allow empty items array', () => {
        const input = { items: [] };
        const [error, dto] = UpdateOrderDto.create(input);
        expect(error).toBeNull();
        expect(dto).toBeDefined();
        expect(dto!.data.items).toEqual([]);
    });
});
