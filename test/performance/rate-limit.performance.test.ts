import request from 'supertest';
import { server } from '../../src/presentation/server';
import { envs } from '../../src/configs/envs';
import { MainRoutes } from '../../src/presentation/routes';
import { RateLimitTestHelper } from '../helpers/rate-limit-test.helper';

describe('Rate Limit Performance Tests', () => {
    let serverInstance: server;
    let app: any;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';

        serverInstance = new server({
            p_port: 0,
            p_routes: MainRoutes.getMainRoutes
        });

        app = serverInstance.app;
    });

    afterAll(async () => {
        if (serverInstance) {
            await serverInstance.close();
        }
    });

    describe('Performance Under Load', () => {
        it('should handle concurrent requests efficiently', async () => {
            const concurrentRequests = 20;
            const promises: Promise<any>[] = [];

            const startTime = Date.now();

            // Crear requests concurrentes
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(
                    request(app)
                        .get('/api/products')
                        .set('X-Forwarded-For', `192.168.1.${i + 1}`) // Diferentes IPs
                );
            }

            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verificar que todas las respuestas fueron exitosas (no rate limited)
            const successfulResponses = responses.filter(r => r.status === 200);
            expect(successfulResponses.length).toBe(concurrentRequests);

            // Verificar que el tiempo total sea razonable (< 5 segundos para 20 requests)
            expect(totalTime).toBeLessThan(5000);

            // Verificar que todos tienen headers de rate limiting
            responses.forEach(response => {
                const headerValidation = RateLimitTestHelper.validateRateLimitHeaders(response.headers);
                expect(headerValidation.isValid).toBe(true);
            });

            console.log(`✅ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
        });

        it('should maintain performance with high request volume from same IP', async () => {
            const requestCount = 50;
            const batchSize = 10;
            const ip = '192.168.100.1';

            let totalTime = 0;
            let successfulRequests = 0;
            let rateLimitedRequests = 0;

            // Hacer requests en lotes para medir rendimiento
            for (let batch = 0; batch < Math.ceil(requestCount / batchSize); batch++) {
                const batchPromises: Promise<any>[] = [];
                const batchStartTime = Date.now();

                for (let i = 0; i < batchSize && (batch * batchSize + i) < requestCount; i++) {
                    batchPromises.push(
                        request(app)
                            .get('/api/products')
                            .set('X-Forwarded-For', ip)
                    );
                }

                const batchResponses = await Promise.all(batchPromises);
                const batchEndTime = Date.now();
                totalTime += (batchEndTime - batchStartTime);

                batchResponses.forEach(response => {
                    if (response.status === 200) {
                        successfulRequests++;
                    } else if (response.status === 429) {
                        rateLimitedRequests++;
                    }
                });

                // Si ya activamos rate limiting, parar
                if (rateLimitedRequests > 0) {
                    break;
                }

                // Pequeña pausa entre lotes
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Verificar métricas de rendimiento
            const averageTimePerRequest = totalTime / (successfulRequests + rateLimitedRequests);
            expect(averageTimePerRequest).toBeLessThan(100); // < 100ms por request

            console.log(`✅ Performance metrics:`);
            console.log(`   - Successful requests: ${successfulRequests}`);
            console.log(`   - Rate limited requests: ${rateLimitedRequests}`);
            console.log(`   - Average time per request: ${averageTimePerRequest.toFixed(2)}ms`);
            console.log(`   - Total time: ${totalTime}ms`);
        });

        it('should handle mixed endpoint load efficiently', async () => {
            const endpoints = [
                '/api/products',
                '/api/categories',
                '/api/cities',
                '/api/health'
            ];

            const requestsPerEndpoint = 5;
            const promises: Promise<any>[] = [];
            const startTime = Date.now();

            // Crear requests para diferentes endpoints
            endpoints.forEach((endpoint, endpointIndex) => {
                for (let i = 0; i < requestsPerEndpoint; i++) {
                    promises.push(
                        request(app)
                            .get(endpoint)
                            .set('X-Forwarded-For', `10.0.${endpointIndex}.${i + 1}`)
                    );
                }
            });

            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verificar distribución de respuestas por endpoint
            const responsesByEndpoint: Record<string, number> = {};
            const statusCounts: Record<number, number> = {};

            responses.forEach((response, index) => {
                const endpoint = endpoints[Math.floor(index / requestsPerEndpoint)];
                responsesByEndpoint[endpoint] = (responsesByEndpoint[endpoint] || 0) + 1;
                statusCounts[response.status] = (statusCounts[response.status] || 0) + 1;
            });

            // Verificar que se distribuyeron correctamente
            Object.values(responsesByEndpoint).forEach(count => {
                expect(count).toBe(requestsPerEndpoint);
            });

            // La mayoría debería ser exitosa
            expect(statusCounts[200] || 0).toBeGreaterThan(endpoints.length * requestsPerEndpoint * 0.8);

            console.log(`✅ Mixed endpoint load test: ${totalTime}ms for ${promises.length} requests`);
            console.log(`   - Status distribution:`, statusCounts);
        });
    });

    describe('Memory and Resource Usage', () => {
        it('should not cause memory leaks with repeated rate limiting', async () => {
            const initialMemory = process.memoryUsage();
            const ip = '192.168.200.1';
            let rateLimitActivated = false;

            // Hacer muchas requests para activar rate limiting múltiples veces
            for (let cycle = 0; cycle < 3; cycle++) {
                for (let i = 0; i < 20; i++) {
                    const response = await request(app)
                        .get('/api/products')
                        .set('X-Forwarded-For', ip);

                    if (response.status === 429) {
                        rateLimitActivated = true;
                        break;
                    }
                }

                if (rateLimitActivated) {
                    // Esperar un poco y luego continuar
                    await new Promise(resolve => setTimeout(resolve, 100));
                    rateLimitActivated = false;
                }
            }

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            // El incremento de memoria no debería ser excesivo (< 10MB)
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

            console.log(`✅ Memory usage test:`);
            console.log(`   - Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   - Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });

        it('should handle rapid successive requests without performance degradation', async () => {
            const iterations = 100;
            const ip = '192.168.200.2';
            const responseTimes: number[] = [];

            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();

                const response = await request(app)
                    .get('/api/health') // Endpoint ligero
                    .set('X-Forwarded-For', ip);

                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);

                // Si activamos rate limiting, parar
                if (response.status === 429) {
                    break;
                }
            }

            // Calcular métricas
            const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);
            const minResponseTime = Math.min(...responseTimes);

            // Verificar que los tiempos de respuesta sean consistentes
            expect(averageResponseTime).toBeLessThan(50); // < 50ms promedio
            expect(maxResponseTime).toBeLessThan(200); // < 200ms máximo

            // La variabilidad no debería ser excesiva
            const standardDeviation = Math.sqrt(
                responseTimes.reduce((sq, time) => sq + Math.pow(time - averageResponseTime, 2), 0) / responseTimes.length
            );
            expect(standardDeviation).toBeLessThan(30); // Baja variabilidad

            console.log(`✅ Response time consistency (${responseTimes.length} requests):`);
            console.log(`   - Average: ${averageResponseTime.toFixed(2)}ms`);
            console.log(`   - Min: ${minResponseTime}ms`);
            console.log(`   - Max: ${maxResponseTime}ms`);
            console.log(`   - Std Dev: ${standardDeviation.toFixed(2)}ms`);
        });
    });

    describe('Scalability Tests', () => {
        it('should scale with multiple different IPs effectively', async () => {
            const ipCount = 50;
            const requestsPerIP = 3;
            const promises: Promise<any>[] = [];

            // Crear requests desde muchas IPs diferentes
            for (let i = 0; i < ipCount; i++) {
                for (let j = 0; j < requestsPerIP; j++) {
                    promises.push(
                        request(app)
                            .get('/api/products')
                            .set('X-Forwarded-For', `10.${Math.floor(i / 255)}.${i % 255}.${j + 1}`)
                    );
                }
            }

            const startTime = Date.now();
            const responses = await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Todas las requests deberían ser exitosas (no rate limited)
            const successfulRequests = responses.filter(r => r.status === 200).length;
            expect(successfulRequests).toBe(ipCount * requestsPerIP);

            // El tiempo total debería ser razonable
            const averageTimePerRequest = totalTime / responses.length;
            expect(averageTimePerRequest).toBeLessThan(100);

            console.log(`✅ Scalability test with ${ipCount} IPs:`);
            console.log(`   - Total requests: ${responses.length}`);
            console.log(`   - Successful: ${successfulRequests}`);
            console.log(`   - Total time: ${totalTime}ms`);
            console.log(`   - Average per request: ${averageTimePerRequest.toFixed(2)}ms`);
        });

        it('should maintain accuracy with high concurrent auth attempts', async () => {
            const concurrentAttempts = 15;
            const ip = '192.168.250.1';
            const authPayload = RateLimitTestHelper.generateTestData('login');

            const promises: Promise<any>[] = [];

            // Crear intentos de auth concurrentes desde la misma IP
            for (let i = 0; i < concurrentAttempts; i++) {
                promises.push(
                    request(app)
                        .post('/api/auth/login')
                        .send(authPayload)
                        .set('X-Forwarded-For', ip)
                );
            }

            const responses = await Promise.all(promises);

            // Contar diferentes tipos de respuesta
            const authFailures = responses.filter(r => r.status === 401).length;
            const rateLimited = responses.filter(r => r.status === 429).length;
            const otherErrors = responses.filter(r => r.status !== 401 && r.status !== 429).length;

            // La mayoría deberían ser auth failures (401) o rate limited (429)
            expect(authFailures + rateLimited).toBe(concurrentAttempts);
            expect(otherErrors).toBe(0);

            // Si hay rate limiting, debería haber algunos auth failures primero
            if (rateLimited > 0) {
                expect(authFailures).toBeGreaterThan(0);
            }

            console.log(`✅ Concurrent auth test:`);
            console.log(`   - Auth failures (401): ${authFailures}`);
            console.log(`   - Rate limited (429): ${rateLimited}`);
            console.log(`   - Other errors: ${otherErrors}`);
        });
    });

    describe('Edge Cases and Stress Tests', () => {
        it('should handle malformed headers gracefully', async () => {
            const malformedHeaders = [
                { 'X-Forwarded-For': '' },
                { 'X-Forwarded-For': 'invalid-ip' },
                { 'X-Forwarded-For': '999.999.999.999' },
                { 'X-Real-IP': 'not-an-ip' },
                { 'X-Forwarded-For': 'a'.repeat(1000) }, // Header muy largo
            ];

            for (const headers of malformedHeaders) {
                const response = await request(app)
                    .get('/api/products')
                    .set(headers);

                // Debería manejar headers malformados sin crash
                expect([200, 429]).toContain(response.status);
                expect(response.headers['ratelimit-limit']).toBeDefined();
            }
        });

        it('should handle rapid connection/disconnection', async () => {
            const rapidRequests = 30;
            const promises: Promise<any>[] = [];

            // Crear requests rápidas que se cancelan/completan rápidamente
            for (let i = 0; i < rapidRequests; i++) {
                promises.push(
                    request(app)
                        .get('/api/health')
                        .timeout(100) // Timeout corto
                        .set('X-Forwarded-For', `192.168.255.${i % 255}`)
                        .catch(err => ({ status: 0, error: err.message })) // Capturar timeouts
                );
            }

            const results = await Promise.all(promises);

            // Algunos pueden fallar por timeout, pero no deberían crashear
            const successful = results.filter(r => r.status === 200).length;
            const timeouts = results.filter(r => r.status === 0).length;
            const rateLimited = results.filter(r => r.status === 429).length;

            expect(successful + timeouts + rateLimited).toBe(rapidRequests);

            console.log(`✅ Rapid connection test:`);
            console.log(`   - Successful: ${successful}`);
            console.log(`   - Timeouts: ${timeouts}`);
            console.log(`   - Rate limited: ${rateLimited}`);
        });
    });

    describe('Configuration Verification', () => {
        it('should have test environment configured for performance testing', () => {
            // Verificar que la configuración de test es apropiada para tests de rendimiento
            const globalLimit = envs.RATE_LIMIT_GLOBAL_MAX_TEST;
            const authLimit = envs.RATE_LIMIT_AUTH_MAX_TEST;
            const globalWindow = envs.RATE_LIMIT_GLOBAL_WINDOW_TEST;
            const authWindow = envs.RATE_LIMIT_AUTH_WINDOW_TEST;

            // Límites altos para permitir tests de rendimiento
            expect(globalLimit).toBeGreaterThanOrEqual(1000);
            expect(authLimit).toBeGreaterThanOrEqual(100);

            // Ventanas cortas para tests rápidos
            expect(globalWindow).toBeLessThanOrEqual(300000); // <= 5 min
            expect(authWindow).toBeLessThanOrEqual(300000); // <= 5 min

            const globalMetrics = RateLimitTestHelper.calculateRateLimitMetrics(globalLimit, globalWindow);
            const authMetrics = RateLimitTestHelper.calculateRateLimitMetrics(authLimit, authWindow);

            // Los límites deberían ser permisivos para tests
            expect(globalMetrics.isPermissive).toBe(true);
            expect(authMetrics.requestsPerMinute).toBeGreaterThan(10);

            console.log(`✅ Test environment configuration:`);
            console.log(`   - Global: ${globalLimit} req/${globalMetrics.windowMinutes}min (${globalMetrics.requestsPerMinute.toFixed(1)} req/min)`);
            console.log(`   - Auth: ${authLimit} req/${authMetrics.windowMinutes}min (${authMetrics.requestsPerMinute.toFixed(1)} req/min)`);
        });
    });
});
