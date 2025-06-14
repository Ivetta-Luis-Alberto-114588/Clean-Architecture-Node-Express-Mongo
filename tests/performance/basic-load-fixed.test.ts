/**
 * Tests de performance básicos usando Jest y Autocannon
 * 
 * Estos tests verifican el rendimiento de los endpoints principales
 * con configuración apropiada para Render.com
 */

import autocannon from 'autocannon';
import { warmupServer, healthCheck, getAuthToken } from './performance-utils';
import { getConfig, TEST_ENDPOINTS } from './performance-config';

const config = getConfig();

describe('Performance Tests - Basic Load Testing', () => {
    let authToken: string;

    // Setup global antes de todos los tests
    beforeAll(async () => {
        console.log('🚀 Iniciando setup para tests de performance...');
        console.log(`🎯 Target: ${config.baseUrl}`);
        console.log(`👥 Max users: ${config.maxUsers}`);
        console.log(`⏱️ Duration: ${config.duration}`);

        // Hacer warmup del servidor (crítico para Render)
        await warmupServer();

        // Verificar que el servidor esté respondiendo
        const isHealthy = await healthCheck();
        if (!isHealthy) {
            throw new Error('❌ Servidor no está respondiendo correctamente');
        }

        // Obtener token de autenticación para tests que lo requieran
        try {
            authToken = await getAuthToken();
            console.log('🔐 Token de autenticación obtenido');
        } catch (error) {
            console.warn('⚠️ No se pudo obtener token de autenticación, algunos tests se saltarán');
        }
    }, 120000); // 2 minutos timeout para el setup

    describe('Public Endpoints Performance', () => {
        test('Health Check endpoint performance', async () => {
            const result = await autocannon({
                url: `${config.baseUrl}${TEST_ENDPOINTS.health}`,
                connections: 10,
                duration: 30, // 30 segundos para test rápido
                headers: {
                    'User-Agent': 'Performance-Test-Bot'
                },
                timeout: config.requestTimeout
            });

            // Assertions básicas
            expect(result.errors).toBe(0);
            expect(result.timeouts).toBe(0);
            expect(result.non2xx).toBe(0);
            expect(result.requests.average).toBeGreaterThan(0);

            // Log resultados
            console.log('📊 Health Check Performance Results:');
            console.log(`   Requests/sec: ${result.requests.average}`);
            console.log(`   Latency avg: ${result.latency.average}ms`);
            console.log(`   Latency max: ${result.latency.max}ms`);
            console.log(`   Errors: ${result.errors}`);

        }, 60000); // 1 minuto timeout

        test('Products listing endpoint performance', async () => {
            const result = await autocannon({
                url: `${config.baseUrl}${TEST_ENDPOINTS.products}`,
                connections: 15,
                duration: 30,
                headers: {
                    'User-Agent': 'Performance-Test-Bot'
                },
                timeout: config.requestTimeout
            });

            // Assertions
            expect(result.errors).toBe(0);
            expect(result.timeouts).toBe(0);
            expect(result.requests.average).toBeGreaterThan(0);

            // Verificar que el rendimiento sea aceptable
            expect(result.latency.average).toBeLessThan(5000); // Menos de 5 segundos promedio
            expect(result.latency.max).toBeLessThan(15000); // Max menos de 15 segundos

            console.log('📊 Products Listing Performance Results:');
            console.log(`   Requests/sec: ${result.requests.average}`);
            console.log(`   Latency avg: ${result.latency.average}ms`);
            console.log(`   Latency max: ${result.latency.max}ms`);
            console.log(`   Total requests: ${result.requests.total}`);

        }, 60000);

        test('Categories endpoint performance', async () => {
            const result = await autocannon({
                url: `${config.baseUrl}${TEST_ENDPOINTS.categories}`,
                connections: 10,
                duration: 20,
                headers: {
                    'User-Agent': 'Performance-Test-Bot'
                },
                timeout: config.requestTimeout
            });

            expect(result.errors).toBe(0);
            expect(result.timeouts).toBe(0);
            expect(result.requests.average).toBeGreaterThan(0);

            console.log('📊 Categories Performance Results:');
            console.log(`   Requests/sec: ${result.requests.average}`);
            console.log(`   Latency avg: ${result.latency.average}ms`);
            console.log(`   Latency max: ${result.latency.max}ms`);

        }, 45000);
    });

    describe('Authenticated Endpoints Performance', () => {
        test('Cart operations performance', async () => {
            if (!authToken) {
                console.log('⏭️ Saltando test de carrito - no hay token de autenticación');
                return;
            }

            const result = await autocannon({
                url: `${config.baseUrl}${TEST_ENDPOINTS.cart.get}`,
                connections: 8,
                duration: 20,
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'User-Agent': 'Performance-Test-Bot'
                },
                timeout: config.requestTimeout
            });

            expect(result.errors).toBe(0);
            expect(result.timeouts).toBe(0);

            console.log('📊 Cart Operations Performance Results:');
            console.log(`   Requests/sec: ${result.requests.average}`);
            console.log(`   Latency avg: ${result.latency.average}ms`);
            console.log(`   Latency max: ${result.latency.max}ms`);
            console.log(`   2xx responses: ${result['2xx']}`);
            console.log(`   Non-2xx responses: ${result.non2xx}`);

        }, 45000);
    });

    describe('Mixed Load Testing', () => {
        test('Mixed endpoints load test', async () => {
            // Test que simula carga mixta en diferentes endpoints
            const endpoints = [
                TEST_ENDPOINTS.health,
                TEST_ENDPOINTS.products,
                TEST_ENDPOINTS.categories
            ];

            const results = await Promise.all(
                endpoints.map(endpoint =>
                    autocannon({
                        url: `${config.baseUrl}${endpoint}`,
                        connections: 5, // Menos conexiones por endpoint
                        duration: 15,   // Duración más corta
                        headers: {
                            'User-Agent': 'Performance-Test-Bot'
                        },
                        timeout: config.requestTimeout
                    })
                )
            );

            // Verificar que todos los endpoints respondan correctamente
            results.forEach((result, index) => {
                expect(result.errors).toBe(0);
                expect(result.timeouts).toBe(0);

                console.log(`📊 Endpoint ${endpoints[index]} Results:`);
                console.log(`   Requests/sec: ${result.requests.average}`);
                console.log(`   Latency avg: ${result.latency.average}ms`);
            });

            // Calcular estadísticas agregadas
            const totalRequests = results.reduce((sum, r) => sum + r.requests.total, 0);
            const avgLatency = results.reduce((sum, r) => sum + r.latency.average, 0) / results.length;

            console.log('📊 Mixed Load Test Aggregate Results:');
            console.log(`   Total requests across all endpoints: ${totalRequests}`);
            console.log(`   Average latency across endpoints: ${avgLatency.toFixed(2)}ms`);

        }, 60000);
    });

    describe('Stress Testing (Limited)', () => {
        test('Maximum concurrent users test', async () => {
            console.log(`🔥 Iniciando test de estrés con ${config.maxUsers} usuarios concurrentes`);

            const result = await autocannon({
                url: `${config.baseUrl}${TEST_ENDPOINTS.products}`,
                connections: config.maxUsers,
                duration: 30, // Duración más corta para stress test
                headers: {
                    'User-Agent': 'Performance-Stress-Test-Bot'
                },
                timeout: config.requestTimeout
            });

            // En stress testing, esperamos algunos errores/timeouts pero no todos
            expect(result.errors + result.timeouts).toBeLessThan(result.requests.total * 0.1); // Menos del 10% de errores

            console.log('📊 Stress Test Results:');
            console.log(`   Total requests: ${result.requests.total}`);
            console.log(`   Requests/sec: ${result.requests.average}`);
            console.log(`   Latency avg: ${result.latency.average}ms`);
            console.log(`   Latency max: ${result.latency.max}ms`);
            console.log(`   Latency min: ${result.latency.min}ms`);
            console.log(`   Errors: ${result.errors}`);
            console.log(`   Timeouts: ${result.timeouts}`);
            console.log(`   2xx responses: ${result['2xx']}`);
            console.log(`   Non-2xx responses: ${result.non2xx}`);

        }, 90000); // 1.5 minutos timeout para stress test
    });
});
