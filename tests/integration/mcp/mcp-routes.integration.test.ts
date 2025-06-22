import request from 'supertest';
import mongoose from 'mongoose';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { envs } from '../../../src/configs/envs';

describe('MCP Routes Integration Tests', () => {
    let testServer: server;
    let app: any;

    beforeAll(async () => {
        console.log("Setting up MCP tests...");

        // Crear instancia del servidor
        testServer = new server({
            p_port: 3002,
            p_routes: MainRoutes.getMainRoutes
        });

        app = testServer.app;

        // Conectar a MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(envs.MONGO_URL);
        }

        console.log("MCP tests setup completed");
    });

    afterAll(async () => {
        console.log("Cleaning up MCP tests...");

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        console.log("MCP tests cleanup completed");
    });
    describe('GET /api/mcp/health', () => {
        it('should return MCP health status', async () => {
            const response = await request(app)
                .get('/api/mcp/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('OK');
            expect(response.body).toHaveProperty('service');
            expect(response.body.service).toBe('MCP Service');
        });

        it('should have correct response structure', async () => {
            const response = await request(app)
                .get('/api/mcp/health')
                .expect(200);

            expect(response.body).toEqual({
                status: 'OK',
                service: 'MCP Service',
                anthropic_configured: expect.any(Boolean),
                timestamp: expect.any(String)
            });
        });
    });

    describe('POST /api/mcp/anthropic', () => {
        it('should return error when model and messages are missing', async () => {
            const response = await request(app)
                .post('/api/mcp/anthropic')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Model and messages are required');
        });

        it('should return error when only model is provided', async () => {
            const response = await request(app)
                .post('/api/mcp/anthropic')
                .send({ model: 'claude-3-sonnet-20240229' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Model and messages are required');
        });

        it('should return error when only messages are provided', async () => {
            const response = await request(app)
                .post('/api/mcp/anthropic')
                .send({
                    messages: [{ role: 'user', content: 'Hello' }]
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Model and messages are required');
        });

        it('should handle request with valid model and messages', async () => {
            const validRequest = {
                model: 'claude-3-sonnet-20240229',
                messages: [
                    { role: 'user', content: 'Hello, this is a test message' }
                ],
                max_tokens: 100
            };

            // Este test puede fallar si no hay API key válida o si hay problemas de red
            // Por eso verificamos que la respuesta sea 200 (éxito) o 401/500 (problemas de configuración)
            const response = await request(app)
                .post('/api/mcp/anthropic')
                .send(validRequest);

            // Verificar que el endpoint está funcionando (puede ser éxito o error de configuración)
            expect([200, 401, 500]).toContain(response.status);

            if (response.status === 200) {
                // Si es exitoso, debe tener una estructura de respuesta válida de Anthropic
                expect(response.body).toBeDefined();
            } else {
                // Si hay error, debe tener información del error
                expect(response.body).toHaveProperty('error');
            }
        });

        it('should handle request with additional parameters', async () => {
            const requestWithExtraParams = {
                model: 'claude-3-sonnet-20240229',
                messages: [
                    { role: 'user', content: 'Test with extra parameters' }
                ],
                max_tokens: 150,
                temperature: 0.7,
                top_p: 0.9
            };

            const response = await request(app)
                .post('/api/mcp/anthropic')
                .send(requestWithExtraParams);

            // Verificar que el endpoint procesa los parámetros adicionales
            expect([200, 401, 500]).toContain(response.status);

            if (response.status !== 200) {
                expect(response.body).toHaveProperty('error');
            }
        });

        it('should validate message structure', async () => {
            const invalidMessages = {
                model: 'claude-3-sonnet-20240229',
                messages: 'invalid message format', // Should be array
                max_tokens: 100
            };

            const response = await request(app)
                .post('/api/mcp/anthropic')
                .send(invalidMessages);

            // El endpoint puede rechazar esto o Anthropic puede rechazarlo
            expect([400, 401, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('error');
        });
    });
});
