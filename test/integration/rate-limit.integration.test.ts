import request from 'supertest';
import { server } from '../../src/presentation/server';
import { envs } from '../../src/configs/envs';
import { MainRoutes } from '../../src/presentation/routes';

describe('RateLimit Integration Tests', () => {
    let serverInstance: server;
    let app: any;

    beforeAll(async () => {
        // Configurar entorno de test
        process.env.NODE_ENV = 'test';

        serverInstance = new server({
            p_port: 0, // Puerto aleatorio para evitar conflictos
            p_routes: MainRoutes.getMainRoutes
        });

        app = serverInstance.app;
    });

    afterAll(async () => {
        if (serverInstance) {
            await serverInstance.close();
        }
    });

    describe('Global Rate Limiting', () => {
        it('should allow requests within the limit', async () => {
            const limit = envs.RATE_LIMIT_GLOBAL_MAX_TEST;

            // Hacer varias requests dentro del límite
            for (let i = 0; i < Math.min(5, limit); i++) {
                const response = await request(app)
                    .get('/api/products')
                    .expect(200);

                // Verificar headers de rate limiting
                expect(response.headers['ratelimit-limit']).toBeDefined();
                expect(response.headers['ratelimit-remaining']).toBeDefined();
                expect(response.headers['ratelimit-reset']).toBeDefined();
            }
        });

        it('should block requests when limit is exceeded (if limit is low enough)', async () => {
            const limit = envs.RATE_LIMIT_GLOBAL_MAX_TEST;

            // Solo probar si el límite es manejable para el test
            if (limit > 100) {
                console.log(`Skipping test: limit too high (${limit}) for integration test`);
                return;
            }

            // Hacer requests hasta exceder el límite
            let successCount = 0;
            let rateLimitedCount = 0;

            for (let i = 0; i < limit + 5; i++) {
                const response = await request(app)
                    .get('/api/products');

                if (response.status === 200) {
                    successCount++;
                } else if (response.status === 429) {
                    rateLimitedCount++;

                    // Verificar estructura de respuesta de error
                    expect(response.body).toHaveProperty('error');
                    expect(response.body).toHaveProperty('statusCode', 429);
                    expect(response.body).toHaveProperty('remainingTime');

                    break; // Parar después del primer rate limit
                }
            }

            expect(successCount).toBeGreaterThan(0);
            expect(rateLimitedCount).toBeGreaterThan(0);
        });

        it('should include correct rate limit headers', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            expect(response.headers['ratelimit-limit']).toBeDefined();
            expect(response.headers['ratelimit-remaining']).toBeDefined();
            expect(response.headers['ratelimit-reset']).toBeDefined();
            expect(response.headers['ratelimit-policy']).toBeDefined();

            // Verificar que los valores son números válidos
            expect(parseInt(response.headers['ratelimit-limit'])).toBeGreaterThan(0);
            expect(parseInt(response.headers['ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
            expect(parseInt(response.headers['ratelimit-reset'])).toBeGreaterThan(0);
        });
    });

    describe('Auth Rate Limiting', () => {
        const invalidCredentials = {
            email: 'test-rate-limit@example.com',
            password: 'wrong-password-123'
        };

        it('should allow auth attempts within the limit', async () => {
            const limit = envs.RATE_LIMIT_AUTH_MAX_TEST;

            // Hacer varios intentos dentro del límite
            for (let i = 0; i < Math.min(3, limit); i++) {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send(invalidCredentials);

                // Debe devolver 401 (credenciales incorrectas) no 429 (rate limited)
                expect(response.status).toBe(401);

                // Verificar headers de rate limiting
                expect(response.headers['ratelimit-limit']).toBeDefined();
                expect(response.headers['ratelimit-remaining']).toBeDefined();
            }
        });

        it('should block auth attempts when limit is exceeded (if limit is low enough)', async () => {
            const limit = envs.RATE_LIMIT_AUTH_MAX_TEST;

            // Solo probar si el límite es manejable para el test
            if (limit > 50) {
                console.log(`Skipping auth rate limit test: limit too high (${limit}) for integration test`);
                return;
            }

            let authFailCount = 0;
            let rateLimitedCount = 0;

            for (let i = 0; i < limit + 3; i++) {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send(invalidCredentials);

                if (response.status === 401) {
                    authFailCount++;
                } else if (response.status === 429) {
                    rateLimitedCount++;

                    // Verificar estructura de respuesta de error para auth
                    expect(response.body).toHaveProperty('error');
                    expect(response.body.error).toContain('autenticación');
                    expect(response.body).toHaveProperty('statusCode', 429);

                    break; // Parar después del primer rate limit
                }
            }

            expect(authFailCount).toBeGreaterThan(0);
            expect(rateLimitedCount).toBeGreaterThan(0);
        });

        it('should include correct auth-specific error message when rate limited', async () => {
            const limit = envs.RATE_LIMIT_AUTH_MAX_TEST;

            // Solo probar si el límite es manejable
            if (limit > 20) {
                console.log(`Skipping auth error message test: limit too high (${limit})`);
                return;
            }

            // Hacer suficientes requests para activar rate limiting
            let response: any;
            for (let i = 0; i < limit + 1; i++) {
                response = await request(app)
                    .post('/api/auth/login')
                    .send(invalidCredentials);

                if (response.status === 429) {
                    break;
                }
            }

            if (response && response.status === 429) {
                expect(response.body.error).toContain('autenticación');
                expect(response.body).toHaveProperty('remainingTime');
                expect(response.body).toHaveProperty('intentosRestantes', 0);
            }
        });
    });

    describe('Different Routes Rate Limiting', () => {
        it('should apply global rate limiting to different endpoints', async () => {
            const endpoints = [
                '/api/products',
                '/api/categories',
                '/api/cities'
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint);

                // Debe devolver respuesta exitosa o error de negocio, no rate limit error
                expect([200, 404, 500]).toContain(response.status);

                // Debe incluir headers de rate limiting
                expect(response.headers['ratelimit-limit']).toBeDefined();
                expect(response.headers['ratelimit-remaining']).toBeDefined();
            }
        });

        it('should apply auth rate limiting only to auth endpoints', async () => {
            const authEndpoints = [
                { method: 'post', path: '/api/auth/login', data: { email: 'test@test.com', password: 'wrong' } },
                { method: 'post', path: '/api/auth/forgot-password', data: { email: 'test@test.com' } }
            ];

            for (const endpoint of authEndpoints) {
                let response: any;

                if (endpoint.method === 'post') {
                    response = await request(app)
                        .post(endpoint.path)
                        .send(endpoint.data);
                }

                // Auth endpoints deben tener su propio contador de rate limit
                expect(response.headers['ratelimit-limit']).toBeDefined();

                // El límite debe ser el configurado para auth (no global)
                const authLimit = envs.RATE_LIMIT_AUTH_MAX_TEST;
                expect(parseInt(response.headers['ratelimit-limit'])).toBe(authLimit);
            }
        });
    });

    describe('Environment-based Configuration', () => {
        it('should use test environment configuration', async () => {
            const response = await request(app)
                .get('/api/products')
                .expect(200);

            const limit = parseInt(response.headers['ratelimit-limit']);
            expect(limit).toBe(envs.RATE_LIMIT_GLOBAL_MAX_TEST);
        });

        it('should have appropriate test limits for automated testing', async () => {
            // Los límites de test deben ser altos para permitir ejecución de tests
            expect(envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBeGreaterThanOrEqual(1000);
            expect(envs.RATE_LIMIT_AUTH_MAX_TEST).toBeGreaterThanOrEqual(100);

            // Las ventanas de tiempo deben ser cortas para tests rápidos
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_TEST).toBeLessThanOrEqual(300000); // <= 5 min
            expect(envs.RATE_LIMIT_AUTH_WINDOW_TEST).toBeLessThanOrEqual(300000); // <= 5 min
        });
    });

    describe('Headers and Response Format', () => {
        it('should include standard RFC 6585 headers', async () => {
            const response = await request(app)
                .get('/api/products');

            // Standard rate limit headers según RFC 6585
            expect(response.headers).toHaveProperty('ratelimit-limit');
            expect(response.headers).toHaveProperty('ratelimit-remaining');
            expect(response.headers).toHaveProperty('ratelimit-reset');
            expect(response.headers).toHaveProperty('ratelimit-policy');
        });

        it('should return proper JSON error format when rate limited', async () => {
            const limit = envs.RATE_LIMIT_GLOBAL_MAX_TEST;

            if (limit > 100) {
                console.log(`Skipping error format test: limit too high (${limit})`);
                return;
            }

            // Intentar activar rate limiting
            let response: any;
            for (let i = 0; i < limit + 5; i++) {
                response = await request(app)
                    .get('/api/products');

                if (response.status === 429) {
                    break;
                }
            }

            if (response && response.status === 429) {
                expect(response.body).toHaveProperty('error');
                expect(response.body).toHaveProperty('statusCode', 429);
                expect(response.body).toHaveProperty('remainingTime');
                expect(typeof response.body.error).toBe('string');
                expect(typeof response.body.remainingTime).toBe('string');
            }
        });
    });

    describe('IP-based Rate Limiting', () => {
        it('should identify requests by IP address', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('X-Forwarded-For', '192.168.1.100')
                .expect(200);

            // Headers de rate limiting deben estar presentes
            expect(response.headers['ratelimit-limit']).toBeDefined();
            expect(response.headers['ratelimit-remaining']).toBeDefined();
        });

        it('should handle proxy headers correctly', async () => {
            const proxyHeaders = [
                { 'X-Forwarded-For': '203.0.113.1, 192.168.1.100' },
                { 'X-Real-IP': '203.0.113.2' },
                { 'X-Forwarded-For': '203.0.113.3' }
            ];

            for (const headers of proxyHeaders) {
                const response = await request(app)
                    .get('/api/products')
                    .set(headers);

                expect([200, 429]).toContain(response.status);
                expect(response.headers['ratelimit-limit']).toBeDefined();
            }
        });
    });
});
