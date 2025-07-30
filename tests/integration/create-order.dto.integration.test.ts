
import { CreateOrderDto } from '../../src/domain/dtos/order/create-order.dto';
import mongoose from 'mongoose';

// Mock de DeliveryMethodModel para evitar dependencia de la base de datos
jest.mock('../../src/data/mongodb/models/delivery-method.model', () => {
    const validId = new mongoose.Types.ObjectId().toHexString();
    return {
        DeliveryMethodModel: {
            findOne: jest.fn().mockImplementation(({ code }) => {
                // Simula método de entrega válido para cualquier code
                return Promise.resolve({
                    _id: validId,
                    code: code || 'DELIVERY',
                    isActive: true,
                    requiresAddress: true
                });
            }),
            findById: jest.fn().mockImplementation((id) => {
                // Simula método de entrega válido para cualquier id
                return Promise.resolve({
                    _id: id,
                    code: 'DELIVERY',
                    isActive: true,
                    requiresAddress: true
                });
            })
        }
    };
});

describe('CreateOrderDto Integration', () => {
    const validProductId = new mongoose.Types.ObjectId().toHexString();
    const validPaymentMethodId = new mongoose.Types.ObjectId().toHexString();
    const validDeliveryMethodId = new mongoose.Types.ObjectId().toHexString();
    const validNeighborhoodId = new mongoose.Types.ObjectId().toHexString();
    const validCityId = new mongoose.Types.ObjectId().toHexString();
    const validAddressId = new mongoose.Types.ObjectId().toHexString();

    // --- Usuario Registrado ---
    it('should create a valid DTO for registered user with selected address', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 2, unitPrice: 100 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            selectedAddressId: validAddressId
        };
        const [error, dto] = await CreateOrderDto.create(props, 'userId');
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.items[0].productId).toBe(validProductId);
        expect(dto!.selectedAddressId).toBe(validAddressId);
    });

    it('should create a valid DTO for registered user with new shipping address', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 50 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            shippingRecipientName: 'Juan',
            shippingPhone: '+5491122334455',
            shippingStreetAddress: 'Calle 123',
            shippingNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = await CreateOrderDto.create(props, 'userId');
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.shippingRecipientName).toBe('Juan');
        expect(dto!.shippingPhone).toBe('+5491122334455');
        expect(dto!.shippingStreetAddress).toBe('Calle 123');
        expect(dto!.shippingNeighborhoodId).toBe(validNeighborhoodId);
    });

    it('should return error if items is missing or empty', async () => {
        const [error, dto] = await CreateOrderDto.create({}, 'userId');
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
        const [error2, dto2] = await CreateOrderDto.create({ items: [] }, 'userId');
        expect(error2).toBeDefined();
        expect(dto2).toBeUndefined();
    });

    it('should return error for invalid productId in items', async () => {
        const props = {
            items: [{ productId: 'invalid', quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId
        };
        const [error, dto] = await CreateOrderDto.create(props, 'userId');
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error for invalid quantity in items', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 0, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId
        };
        const [error, dto] = await CreateOrderDto.create(props, 'userId');
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error for invalid unitPrice in items', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: -1 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId
        };
        const [error, dto] = await CreateOrderDto.create(props, 'userId');
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if both selectedAddressId and shippingStreetAddress are provided', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            selectedAddressId: validAddressId,
            shippingStreetAddress: 'Calle 123',
            shippingRecipientName: 'Juan',
            shippingPhone: '+5491122334455',
            shippingNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = await CreateOrderDto.create(props, 'userId');
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if selectedAddressId is invalid', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            selectedAddressId: 'invalid-id'
        };
        const [error, dto] = await CreateOrderDto.create(props, 'userId');
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    // --- Usuario Invitado ---
    it('should create a valid DTO for guest with shipping address', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            customerName: 'Invitado',
            customerEmail: 'guest@test.com',
            shippingRecipientName: 'Juan',
            shippingPhone: '+5491122334455',
            shippingStreetAddress: 'Calle 123',
            shippingNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = await CreateOrderDto.create(props);
        expect(error).toBeUndefined();
        expect(dto).toBeDefined();
        expect(dto!.customerName).toBe('Invitado');
        expect(dto!.customerEmail).toBe('guest@test.com');
        expect(dto!.shippingRecipientName).toBe('Juan');
    });

    it('should return error if customerName is missing for guest', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            customerEmail: 'guest@test.com',
            shippingRecipientName: 'Juan',
            shippingPhone: '+5491122334455',
            shippingStreetAddress: 'Calle 123',
            shippingNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = await CreateOrderDto.create(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if customerEmail is missing or invalid for guest', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            customerName: 'Invitado',
            shippingRecipientName: 'Juan',
            shippingPhone: '+5491122334455',
            shippingStreetAddress: 'Calle 123',
            shippingNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = await CreateOrderDto.create(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
        const props2 = { ...props, customerEmail: 'invalid-email' };
        const [error2, dto2] = await CreateOrderDto.create(props2);
        expect(error2).toBeDefined();
        expect(dto2).toBeUndefined();
    });

    it('should return error if guest provides selectedAddressId', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            customerName: 'Invitado',
            customerEmail: 'guest@test.com',
            selectedAddressId: validAddressId
        };
        const [error, dto] = await CreateOrderDto.create(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should return error if shippingPhone is invalid for guest', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            customerName: 'Invitado',
            customerEmail: 'guest@test.com',
            shippingRecipientName: 'Juan',
            shippingPhone: 'abc',
            shippingStreetAddress: 'Calle 123',
            shippingNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = await CreateOrderDto.create(props);
        expect(error).toBeDefined();
        expect(dto).toBeUndefined();
    });

    it('should trim string fields for guest (except validated fields)', async () => {
        const props = {
            items: [{ productId: validProductId, quantity: 1, unitPrice: 10 }],
            paymentMethodId: validPaymentMethodId,
            deliveryMethodId: validDeliveryMethodId,
            customerName: ' Invitado ',  // Este se puede trimmear
            customerEmail: 'laivetta@gmail.com',  // Este debe estar limpio para pasar validación
            shippingRecipientName: ' Juan ',  // Este se puede trimmear
            shippingPhone: '+5491122334455',  // Este debe estar limpio para pasar validación
            shippingStreetAddress: ' Calle 123 ',  // Este se puede trimmear
            shippingNeighborhoodId: validNeighborhoodId
        };
        const [error, dto] = await CreateOrderDto.create(props);
        expect(error).toBeUndefined();
        expect(dto!.customerName).toBe('Invitado');  // Trimmed
        expect(dto!.customerEmail).toBe('laivetta@gmail.com');  // Cleaned
        expect(dto!.shippingRecipientName).toBe('Juan');  // Trimmed
        expect(dto!.shippingPhone).toBe('+5491122334455');  // Clean
        expect(dto!.shippingStreetAddress).toBe('Calle 123');  // Trimmed
    });
});
