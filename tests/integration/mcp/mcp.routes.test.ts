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
    }); afterAll(async () => {
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

            expect(response.body).toEqual({
                status: 'ok',
                service: 'MCP Service',
                timestamp: expect.any(String),
                version: '1.0.0'
            });
        });
    });

    describe('GET /api/mcp/tools', () => {
        test('should return list of available tools', async () => {
            const response = await request(testServer.app)
                .get('/api/mcp/tools')
                .expect(200);

            expect(response.body).toHaveProperty('tools');
            expect(Array.isArray(response.body.tools)).toBe(true);
            expect(response.body.tools.length).toBeGreaterThan(0);

            // Verificar estructura de las herramientas
            const tool = response.body.tools[0];
            expect(tool).toHaveProperty('name');
            expect(tool).toHaveProperty('description');
            expect(tool).toHaveProperty('inputSchema');
            expect(tool.inputSchema).toHaveProperty('type');
            expect(tool.inputSchema).toHaveProperty('properties');
        });

        test('should include expected tools', async () => {
            const response = await request(testServer.app)
                .get('/api/mcp/tools')
                .expect(200);

            const toolNames = response.body.tools.map((tool: any) => tool.name);

            expect(toolNames).toContain('get_customers');
            expect(toolNames).toContain('get_customer_by_id');
            expect(toolNames).toContain('get_products');
            expect(toolNames).toContain('get_product_by_id');
            expect(toolNames).toContain('search_database');
        });
    });

    describe('POST /api/mcp/call', () => {
        test('should execute get_customers tool successfully', async () => {
            const callData = {
                toolName: 'get_customers',
                arguments: { page: 1, limit: 5 }
            };

            const response = await request(testServer.app)
                .post('/api/mcp/call')
                .send(callData)
                .expect(200);

            expect(response.body).toHaveProperty('content');
            expect(Array.isArray(response.body.content)).toBe(true);
            expect(response.body.content[0]).toHaveProperty('type', 'text');
            expect(response.body.content[0]).toHaveProperty('text');

            // Verificar que el contenido sea JSON válido
            const data = JSON.parse(response.body.content[0].text);
            expect(data).toHaveProperty('customers');
            expect(data).toHaveProperty('page', 1);
            expect(data).toHaveProperty('limit', 5);
        });

        test('should execute get_products tool successfully', async () => {
            const callData = {
                toolName: 'get_products',
                arguments: { page: 1, limit: 3 }
            };

            const response = await request(testServer.app)
                .post('/api/mcp/call')
                .send(callData)
                .expect(200);

            expect(response.body).toHaveProperty('content');
            const data = JSON.parse(response.body.content[0].text);
            expect(data).toHaveProperty('products');
            expect(data).toHaveProperty('total');
        });

        test('should execute search_database tool successfully', async () => {
            const callData = {
                toolName: 'search_database',
                arguments: {
                    query: 'test',
                    entities: ['products', 'customers']
                }
            };

            const response = await request(testServer.app)
                .post('/api/mcp/call')
                .send(callData)
                .expect(200);

            expect(response.body).toHaveProperty('content');
            const data = JSON.parse(response.body.content[0].text);
            expect(data).toHaveProperty('products');
            expect(data).toHaveProperty('customers');
        });

        test('should return error for invalid tool name', async () => {
            const callData = {
                toolName: 'invalid_tool',
                arguments: {}
            };

            const response = await request(testServer.app)
                .post('/api/mcp/call')
                .send(callData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Herramienta desconocida');
        });

        test('should return error for missing toolName', async () => {
            const callData = {
                arguments: { page: 1 }
            };

            const response = await request(testServer.app)
                .post('/api/mcp/call')
                .send(callData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Tool name is required');
        });

        test('should return error for missing arguments', async () => {
            const callData = {
                toolName: 'get_customers'
            };

            const response = await request(testServer.app)
                .post('/api/mcp/call')
                .send(callData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Arguments must be an object');
        });

        test('should handle get_customer_by_id with valid ID', async () => {
            // Primero necesitamos un ID válido de cliente
            // Para este test, asumimos que hay al menos un cliente en la DB
            const customersResponse = await request(testServer.app)
                .post('/api/mcp/call')
                .send({ toolName: 'get_customers', arguments: { page: 1, limit: 1 } });

            const customersData = JSON.parse(customersResponse.body.content[0].text);

            if (customersData.customers.length > 0) {
                const customerId = customersData.customers[0].id;

                const response = await request(testServer.app)
                    .post('/api/mcp/call')
                    .send({
                        toolName: 'get_customer_by_id',
                        arguments: { id: customerId }
                    })
                    .expect(200);

                expect(response.body).toHaveProperty('content');
                const data = JSON.parse(response.body.content[0].text);
                expect(data).toHaveProperty('id', customerId);
                expect(data).toHaveProperty('name');
                expect(data).toHaveProperty('email');
            }
        });

        test('should handle get_customer_by_id with invalid ID', async () => {
            const response = await request(testServer.app)
                .post('/api/mcp/call')
                .send({
                    toolName: 'get_customer_by_id',
                    arguments: { id: 'invalid_id_123' }
                })
                .expect(200);

            expect(response.body).toHaveProperty('content');
            expect(response.body.content[0].text).toContain('no encontrado');
        });
    });
});
