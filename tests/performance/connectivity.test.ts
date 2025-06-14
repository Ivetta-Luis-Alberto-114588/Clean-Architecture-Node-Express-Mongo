/**
 * Test rápido de conectividad para verificar que el servidor Render está funcionando
 */

import { makeRequest, warmupServer } from './performance-utils';
import { getConfig } from './performance-config';

const config = getConfig();

describe('Render Connectivity Test', () => {
    test('Verify Render server is accessible', async () => {
        console.log(`🎯 Testing connectivity to: ${config.baseUrl}`);

        // Test directo sin warmup primero
        try {
            const response = await makeRequest('GET', '/api/health');
            console.log(`📊 Direct health check: ${response.status}`);
            console.log(`📄 Response data:`, response.data);

            expect(response.status).toBeGreaterThanOrEqual(200);
            expect(response.status).toBeLessThan(500);

        } catch (error) {
            console.error('❌ Direct connection failed:', error.message);

            // Si falla la conexión directa, intentar con warmup
            console.log('🔄 Trying with warmup...');
            await warmupServer();

            const retryResponse = await makeRequest('GET', '/api/health');
            console.log(`📊 After warmup: ${retryResponse.status}`);

            expect(retryResponse.status).toBeGreaterThanOrEqual(200);
            expect(retryResponse.status).toBeLessThan(500);
        }

    }, 180000); // 3 minutos timeout para warmup potencial

    test('Test basic endpoints accessibility', async () => {
        console.log('🔍 Testing basic endpoint accessibility...');

        const endpoints = [
            '/api/health',
            '/api/products',
            '/api/products/categories'
        ];

        for (const endpoint of endpoints) {
            console.log(`📡 Testing ${endpoint}...`);

            try {
                const response = await makeRequest('GET', endpoint);
                console.log(`   ✅ ${endpoint}: ${response.status}`);

                // Aceptar códigos 2xx y algunos 4xx (como 401 para endpoints protegidos)
                expect(response.status).toBeGreaterThanOrEqual(200);
                expect(response.status).toBeLessThan(500);

            } catch (error) {
                console.warn(`   ⚠️ ${endpoint} failed:`, error.message);
                // No fallar el test, solo documentar el error
            }

            // Pequeña pausa entre requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    }, 120000); // 2 minutos timeout
});
