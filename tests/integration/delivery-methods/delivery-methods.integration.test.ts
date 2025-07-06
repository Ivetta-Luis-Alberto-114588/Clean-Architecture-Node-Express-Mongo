// tests/integration/delivery-methods/delivery-methods.integration.test.ts

import request from 'supertest';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { DeliveryMethodModel } from '../../../src/data/mongodb/models/delivery-method.model';
import { seedDeliveryMethods } from '../../../src/seeders/delivery-methods.seeder';

describe('Delivery Methods API Integration Tests', () => {
    let testServer: server;

    beforeAll(async () => {
        // Crear servidor Express
        testServer = new server({
            p_port: 3001,
            p_routes: MainRoutes.getMainRoutes
        });
    });

    beforeEach(async () => {
        // Limpiar colección antes de cada test
        await DeliveryMethodModel.deleteMany({});
        // Sembrar datos de prueba
        await seedDeliveryMethods();
    });

    describe('GET /api/delivery-methods', () => {
        it('should return active delivery methods', async () => {
            const response = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(2);

            // Verificar estructura del primer método
            const shippingMethod = response.body.find((method: any) => method.code === 'SHIPPING');
            expect(shippingMethod).toBeDefined();
            expect(shippingMethod).toMatchObject({
                code: 'SHIPPING',
                name: 'Envío a Domicilio',
                description: 'Recibe tu pedido en la puerta de tu casa.',
                requiresAddress: true,
                isActive: true
            });
            expect(shippingMethod.id).toBeDefined();

            // Verificar estructura del segundo método
            const pickupMethod = response.body.find((method: any) => method.code === 'PICKUP');
            expect(pickupMethod).toBeDefined();
            expect(pickupMethod).toMatchObject({
                code: 'PICKUP',
                name: 'Retiro en Local',
                description: 'Acércate a nuestra tienda a retirar tu pedido.',
                requiresAddress: false,
                isActive: true
            });
            expect(pickupMethod.id).toBeDefined();
        });

        it('should return only active delivery methods', async () => {
            // Crear un método inactivo
            await DeliveryMethodModel.create({
                code: 'EXPRESS',
                name: 'Envío Express',
                description: 'Entrega en 24 horas',
                requiresAddress: true,
                isActive: false
            });

            const response = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(2); // Solo los activos originales

            // Verificar que no incluye el método inactivo
            const expressMethod = response.body.find((method: any) => method.code === 'EXPRESS');
            expect(expressMethod).toBeUndefined();

            // Verificar que todos los métodos retornados están activos
            response.body.forEach((method: any) => {
                expect(method.isActive).toBe(true);
            });
        });

        it('should return empty array when no active delivery methods exist', async () => {
            // Desactivar todos los métodos
            await DeliveryMethodModel.updateMany({}, { isActive: false });

            const response = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(0);
        });

        it('should have correct response structure for each delivery method', async () => {
            const response = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);

            response.body.forEach((method: any) => {
                expect(method).toHaveProperty('id');
                expect(method).toHaveProperty('code');
                expect(method).toHaveProperty('name');
                expect(method).toHaveProperty('description');
                expect(method).toHaveProperty('requiresAddress');
                expect(method).toHaveProperty('isActive');

                expect(typeof method.id).toBe('string');
                expect(typeof method.code).toBe('string');
                expect(typeof method.name).toBe('string');
                expect(typeof method.description).toBe('string');
                expect(typeof method.requiresAddress).toBe('boolean');
                expect(typeof method.isActive).toBe('boolean');
                expect(method.isActive).toBe(true);
            });
        });

        it('should return 200 even when collection is empty', async () => {
            // Limpiar completamente la colección
            await DeliveryMethodModel.deleteMany({});

            const response = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body).toHaveLength(0);
        });

        it('should have correct content-type header', async () => {
            const response = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200)
                .expect('Content-Type', /json/);

            expect(response.body).toBeInstanceOf(Array);
        });

        it('should return delivery methods sorted consistently', async () => {
            // Hacer múltiples requests para verificar consistencia
            const response1 = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200);

            const response2 = await request(testServer.app)
                .get('/api/delivery-methods')
                .expect(200);

            expect(response1.body).toEqual(response2.body);
        });
    });
});
