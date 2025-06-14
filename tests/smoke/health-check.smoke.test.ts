import request from 'supertest';
import mongoose from 'mongoose';
import { server } from '../../src/presentation/server';
import { MainRoutes } from '../../src/presentation/routes';
import { envs } from '../../src/configs/envs';

describe('Health Check - Smoke Tests', () => {
    let testServer: server;
    let app: any;

    beforeAll(async () => {
        console.log("Setting up Health Check smoke tests...");

        // 1. Crear instancia del servidor de testing
        testServer = new server({
            p_port: 3002, // Puerto diferente para evitar conflictos
            p_routes: MainRoutes.getMainRoutes
        });

        // 2. Obtener la aplicación Express
        app = testServer.app;    // 3. No necesitamos llamar a start() ya que solo usamos app para supertest
        // await testServer.start();
    });
    afterAll(async () => {
        console.log("Cleaning up Health Check smoke tests...");
        // Los smoke tests no necesitan limpiar la base de datos
        // ya que solo verifican el estado de la aplicación
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

    describe('Database Health Check', () => {
        it('should verify MongoDB connection is healthy', async () => {
            const response = await request(app)
                .get('/api/health/db')
                .expect(200);

            expect(response.body).toMatchObject({
                database: 'connected'
            });

            expect(response.body.dbName).toBeDefined();
            expect(response.body.timestamp).toBeDefined();
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });

        it('should return database name in health check', async () => {
            const response = await request(app)
                .get('/api/health/db')
                .expect(200);

            expect(response.body.dbName).toBe(envs.MONGO_DB_NAME);
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

    describe('Performance Basic Check', () => {
        it('should respond to health check within reasonable time', async () => {
            const startTime = Date.now();

            await request(app)
                .get('/api/health')
                .expect(200);

            const responseTime = Date.now() - startTime;

            // El health check debería responder en menos de 1 segundo
            expect(responseTime).toBeLessThan(1000);
        });

        it('should respond to database health check within reasonable time', async () => {
            const startTime = Date.now();

            await request(app)
                .get('/api/health/db')
                .expect(200);

            const responseTime = Date.now() - startTime;

            // La verificación de DB debería responder en menos de 2 segundos
            expect(responseTime).toBeLessThan(2000);
        });
    });
});
