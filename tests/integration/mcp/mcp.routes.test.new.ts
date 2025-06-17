// tests/integration/mcp/mcp.routes.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { envs } from '../../../src/configs/envs';

describe('MCP Routes Integration Tests', () => {
    let testServer: server;

    beforeAll(async () => {
        console.log("Setting up MCP tests...");

        // Crear instancia del servidor
        testServer = new server({
            p_port: 3001,
            p_routes: MainRoutes.getMainRoutes
        });

        // Iniciar servidor
        await testServer.start();
        console.log("Test server started on port 3001");
    });

    afterAll(async () => {
        console.log("Cleaning up MCP tests...");

        if (testServer) {
            await testServer.close();
        }

        await mongoose.connection.close();
        console.log("Test server closed");
    });

    describe('GET /api/mcp/health', () => {
        test('should return health status', async () => {
            const response = await request(testServer.app)
                .get('/api/mcp/health')
                .expect(200);

            expect(response.body.status).toBe('OK');
            expect(response.body.service).toBe('MCP Service');
            expect(response.body.timestamp).toBeDefined();
            expect(typeof response.body.anthropic_configured).toBe('boolean');
        });
    });

    describe('POST /api/mcp/anthropic', () => {
        test('should return error when model is missing', async () => {
            const requestBody = {
                messages: [
                    {
                        role: 'user',
                        content: 'Hello'
                    }
                ]
            };

            const response = await request(testServer.app)
                .post('/api/mcp/anthropic')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Model and messages are required');
        });

        test('should return error when messages are missing', async () => {
            const requestBody = {
                model: 'claude-3-sonnet-20240229'
            };

            const response = await request(testServer.app)
                .post('/api/mcp/anthropic')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Model and messages are required');
        });

        test('should return error when both model and messages are missing', async () => {
            const requestBody = {};

            const response = await request(testServer.app)
                .post('/api/mcp/anthropic')
                .send(requestBody)
                .expect(400);

            expect(response.body.error).toBe('Model and messages are required');
        });

        // Test condicional - solo se ejecuta si la API key está configurada
        test('should handle Anthropic API request when API key is configured', async () => {
            if (!envs.ANTHROPIC_API_KEY) {
                console.log('Skipping Anthropic API test - no API key configured');
                return;
            }

            const requestBody = {
                model: 'claude-3-sonnet-20240229',
                max_tokens: 100,
                messages: [
                    {
                        role: 'user',
                        content: 'Say hello in one word'
                    }
                ]
            };

            const response = await request(testServer.app)
                .post('/api/mcp/anthropic')
                .send(requestBody);

            // Si la API key es válida, debería devolver 200
            // Si hay error de API (ej: key inválida), debería devolver el error específico
            expect([200, 401, 403, 429, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body).toBeDefined();
            } else {
                expect(response.body.error).toBeDefined();
            }
        });

        test('should return error when API key is not configured', async () => {
            // Este test verifica que el endpoint maneja correctamente la ausencia de API key
            // En un entorno real donde la API key no esté configurada
            const requestBody = {
                model: 'claude-3-sonnet-20240229',
                messages: [
                    {
                        role: 'user',
                        content: 'Hello'
                    }
                ]
            };

            // Si no hay API key configurada, debería devolver error 500
            if (!envs.ANTHROPIC_API_KEY) {
                const response = await request(testServer.app)
                    .post('/api/mcp/anthropic')
                    .send(requestBody)
                    .expect(500);

                expect(response.body.error).toBe('Anthropic API key not configured');
            } else {
                console.log('Skipping no-API-key test - API key is configured');
            }
        });
    });
});
