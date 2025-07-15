import request from 'supertest';
import { app } from '../../../src/app.test';
import { DeliveryMethodModel } from '../../../src/data/mongodb/models/delivery-method.model';
import { ProductModel } from '../../../src/data/mongodb/models/products/product.model';
import { CategoryModel } from '../../../src/data/mongodb/models/products/category.model';
import { UnitModel } from '../../../src/data/mongodb/models/products/unit.model';
import { OrderStatusModel } from '../../../src/data/mongodb/models/order/order-status.model';
import { NeighborhoodModel } from '../../../src/data/mongodb/models/customers/neighborhood.model';
import { CityModel } from '../../../src/data/mongodb/models/customers/city.model';

describe('Guest Checkout - Retiro en local (PICKUP) - Integración', () => {
    let deliveryMethodId: string;
    let productId: string;

    beforeAll(async () => {
        // Limpiar método de entrega PICKUP si existe para evitar duplicados
        await DeliveryMethodModel.deleteMany({ code: 'PICKUP' });
        const deliveryMethod = await DeliveryMethodModel.create({
            name: 'Retiro en Local',
            code: 'PICKUP',
            description: 'Retiro en local',
            requiresAddress: false,
            isActive: true,
            price: 0
        });
        deliveryMethodId = deliveryMethod._id.toString();

        // Crear una categoría para el producto
        const category = await CategoryModel.create({
            name: 'Test Category',
            description: 'Category for testing',
            isActive: true
        });

        // Crear una unidad para el producto
        const unit = await UnitModel.create({
            name: 'Test Unit',
            symbol: 'tu',
            description: 'Unit for testing',
            isActive: true
        });

        // Crear producto de prueba
        const product = await ProductModel.create({
            name: 'Test Product',
            description: 'Product for testing',
            price: 100,
            stock: 10,
            category: category._id,
            unit: unit._id,
            taxRate: 0,
            isActive: true,
            images: []
        });
        productId = product._id.toString();

        // Crear estado de orden por defecto
        await OrderStatusModel.create({
            name: 'Pendiente',
            code: 'PENDING',
            description: 'Pedido pendiente de procesamiento',
            isActive: true,
            color: '#FFA500',
            order: 1,
            isDefault: true,
            canTransitionTo: []
        });

        // Crear ciudad y barrio para guest checkout
        const city = await CityModel.create({
            name: 'Test City',
            description: 'City for testing',
            isActive: true
        });

        await NeighborhoodModel.create({
            name: 'Test Neighborhood',
            description: 'Neighborhood for testing',
            city: city._id,
            isActive: true
        });
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        if (deliveryMethodId) {
            await DeliveryMethodModel.findByIdAndDelete(deliveryMethodId);
        }
        if (productId) {
            await ProductModel.findByIdAndDelete(productId);
        }
        // Limpiar categoría y unidad
        await CategoryModel.deleteMany({ name: 'Test Category' });
        await UnitModel.deleteMany({ name: 'Test Unit' });
        // Limpiar estados de orden
        await OrderStatusModel.deleteMany({ code: 'PENDING' });
        // Limpiar ciudad y barrio
        await NeighborhoodModel.deleteMany({ name: 'Test Neighborhood' });
        await CityModel.deleteMany({ name: 'Test City' });
    });

    it('should allow guest order with PICKUP method and no address fields (integration)', async () => {
        const orderBody = {
            items: [
                { productId, quantity: 1, unitPrice: 100 }
            ],
            deliveryMethodId,
            customerName: 'Invitado',
            customerEmail: 'guest_123@checkout.guest',
            // No se envía ningún campo de dirección ni shipping
        };

        const response = await request(app)
            .post('/api/orders')
            .send(orderBody)
            .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body.data).toHaveProperty('customer');
        expect(response.body.data.customer.email).toBe('guest_123@checkout.guest');
        expect(response.body.data).toHaveProperty('items');
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.items[0].product.id).toBe(productId);
    });
});
