// tests/smoke/basic/health-endpoints.smoke.test.ts

import request from 'supertest';
import { setupSmokeTests, cleanupSmokeTests, app } from '../utils/test-setup';
import { envs } from '../../../src/configs/envs';

describe('Basic Health Endpoints - Smoke Tests', () => {
    beforeAll(async () => {
        await setupSmokeTests();
    });

    afterAll(async () => {
        await cleanupSmokeTests();
    });

    describe('Basic Health Endpoints', () => {
        it('should respond with OK status on root endpoint', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);

            expect(response.body).toEqual({
                message: 'API E-commerce V1 - Running OK'
            });
        });

        it('should respond to HEAD request on root endpoint', async () => {
            await request(app)
                .head('/')
                .expect(200);
        });

        it('should respond with pong on ping endpoint', async () => {
            const response = await request(app)
                .get('/ping')
                .expect(200);

            expect(response.text).toBe('pong');
        });

        it('should return health status with timestamp', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'OK',
                service: 'E-commerce Backend API',
                version: '1.0.0'
            });

            expect(response.body.timestamp).toBeDefined();
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('Service Availability', () => {
        it('should have all critical routes accessible', async () => {
            // Verificar que las rutas principales respondan (sin autenticación)
            const criticalRoutes = [
                '/api/products',
                '/api/categories',
                '/api/cities',
                '/api/neighborhoods'
            ];

            for (const route of criticalRoutes) {
                const response = await request(app)
                    .get(route)
                    .expect((res) => {
                        // Aceptar 200 (OK) o 401 (sin auth) como respuestas válidas
                        // Lo importante es que el endpoint responda, no que tenga permisos
                        expect([200, 401]).toContain(res.status);
                    });
            }
        });

        it('should reject invalid routes with 404', async () => {
            await request(app)
                .get('/api/invalid-route-that-does-not-exist')
                .expect(404);
        });
    });

    describe('Basic Error Handling', () => {
        it('should handle malformed requests gracefully', async () => {
            const response = await request(app)
                .post('/api/health')  // POST en lugar de GET
                .expect(404);
        });

        it('should return JSON responses with proper headers', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200)
                .expect('Content-Type', /json/);
        });
    });
});
