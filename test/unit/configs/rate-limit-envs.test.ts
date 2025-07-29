import { envs } from '../../../src/configs/envs';

// Mock para simular diferentes configuraciones de variables de entorno
const mockEnvs = (mockConfig: any) => {
    Object.keys(mockConfig).forEach(key => {
        Object.defineProperty(envs, key, {
            value: mockConfig[key],
            configurable: true
        });
    });
};

describe('Environment Variables Configuration for Rate Limiting', () => {
    const originalEnvs = { ...envs };

    afterEach(() => {
        // Restaurar configuración original
        Object.keys(originalEnvs).forEach(key => {
            Object.defineProperty(envs, key, {
                value: (originalEnvs as any)[key],
                configurable: true
            });
        });
    });

    describe('Production Environment Variables', () => {
        it('should have production rate limit variables defined', () => {
            expect(envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION).toBeDefined();
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION).toBeDefined();
            expect(envs.RATE_LIMIT_AUTH_MAX_PRODUCTION).toBeDefined();
            expect(envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION).toBeDefined();
        });

        it('should have appropriate production values', () => {
            // Los límites de producción deben ser conservadores para seguridad
            expect(envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION).toBeLessThanOrEqual(2000);
            expect(envs.RATE_LIMIT_AUTH_MAX_PRODUCTION).toBeLessThanOrEqual(50);

            // Las ventanas de tiempo deben ser suficientemente largas
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION).toBeGreaterThanOrEqual(600000); // >= 10 min
            expect(envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION).toBeGreaterThanOrEqual(900000); // >= 15 min
        });

        it('should have numeric values for production settings', () => {
            expect(typeof envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION).toBe('number');
            expect(typeof envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION).toBe('number');
            expect(typeof envs.RATE_LIMIT_AUTH_MAX_PRODUCTION).toBe('number');
            expect(typeof envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION).toBe('number');
        });

        it('should have positive values for production settings', () => {
            expect(envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_AUTH_MAX_PRODUCTION).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION).toBeGreaterThan(0);
        });
    });

    describe('Development Environment Variables', () => {
        it('should have development rate limit variables defined', () => {
            expect(envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT).toBeDefined();
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT).toBeDefined();
            expect(envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT).toBeDefined();
            expect(envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT).toBeDefined();
        });

        it('should have more permissive development values than production', () => {
            // Development debe tener límites más altos que production
            expect(envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT).toBeGreaterThanOrEqual(
                envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION
            );
            expect(envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT).toBeGreaterThanOrEqual(
                envs.RATE_LIMIT_AUTH_MAX_PRODUCTION
            );

            // Development puede tener ventanas más cortas para testing rápido
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT).toBeLessThanOrEqual(
                envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION
            );
        });

        it('should have numeric values for development settings', () => {
            expect(typeof envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT).toBe('number');
            expect(typeof envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT).toBe('number');
            expect(typeof envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT).toBe('number');
            expect(typeof envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT).toBe('number');
        });

        it('should have positive values for development settings', () => {
            expect(envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT).toBeGreaterThan(0);
        });
    });

    describe('Test Environment Variables', () => {
        it('should have test rate limit variables defined', () => {
            expect(envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBeDefined();
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_TEST).toBeDefined();
            expect(envs.RATE_LIMIT_AUTH_MAX_TEST).toBeDefined();
            expect(envs.RATE_LIMIT_AUTH_WINDOW_TEST).toBeDefined();
        });

        it('should have very permissive test values for automated testing', () => {
            // Test debe tener límites muy altos para permitir tests automatizados
            expect(envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBeGreaterThanOrEqual(1000);
            expect(envs.RATE_LIMIT_AUTH_MAX_TEST).toBeGreaterThanOrEqual(100);

            // Test debe tener ventanas cortas para tests rápidos
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_TEST).toBeLessThanOrEqual(300000); // <= 5 min
            expect(envs.RATE_LIMIT_AUTH_WINDOW_TEST).toBeLessThanOrEqual(300000); // <= 5 min
        });

        it('should have the highest limits among all environments', () => {
            expect(envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBeGreaterThanOrEqual(
                Math.max(envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION, envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT)
            );
            expect(envs.RATE_LIMIT_AUTH_MAX_TEST).toBeGreaterThanOrEqual(
                Math.max(envs.RATE_LIMIT_AUTH_MAX_PRODUCTION, envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT)
            );
        });

        it('should have numeric values for test settings', () => {
            expect(typeof envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBe('number');
            expect(typeof envs.RATE_LIMIT_GLOBAL_WINDOW_TEST).toBe('number');
            expect(typeof envs.RATE_LIMIT_AUTH_MAX_TEST).toBe('number');
            expect(typeof envs.RATE_LIMIT_AUTH_WINDOW_TEST).toBe('number');
        });

        it('should have positive values for test settings', () => {
            expect(envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_TEST).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_AUTH_MAX_TEST).toBeGreaterThan(0);
            expect(envs.RATE_LIMIT_AUTH_WINDOW_TEST).toBeGreaterThan(0);
        });
    });

    describe('Environment Consistency', () => {
        it('should have all required rate limiting variables for each environment', () => {
            const requiredVariables = [
                'RATE_LIMIT_GLOBAL_MAX_PRODUCTION',
                'RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION',
                'RATE_LIMIT_AUTH_MAX_PRODUCTION',
                'RATE_LIMIT_AUTH_WINDOW_PRODUCTION',
                'RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT',
                'RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT',
                'RATE_LIMIT_AUTH_MAX_DEVELOPMENT',
                'RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT',
                'RATE_LIMIT_GLOBAL_MAX_TEST',
                'RATE_LIMIT_GLOBAL_WINDOW_TEST',
                'RATE_LIMIT_AUTH_MAX_TEST',
                'RATE_LIMIT_AUTH_WINDOW_TEST'
            ];

            requiredVariables.forEach(varName => {
                expect((envs as any)[varName]).toBeDefined();
                expect(typeof (envs as any)[varName]).toBe('number');
                expect((envs as any)[varName]).toBeGreaterThan(0);
            });
        });

        it('should have logical relationships between max and window values', () => {
            // Ventanas más largas deberían permitir más requests
            const environments = ['PRODUCTION', 'DEVELOPMENT', 'TEST'];

            environments.forEach(env => {
                const globalMax = (envs as any)[`RATE_LIMIT_GLOBAL_MAX_${env}`];
                const globalWindow = (envs as any)[`RATE_LIMIT_GLOBAL_WINDOW_${env}`];
                const authMax = (envs as any)[`RATE_LIMIT_AUTH_MAX_${env}`];
                const authWindow = (envs as any)[`RATE_LIMIT_AUTH_WINDOW_${env}`];

                // Auth limits should be more restrictive than global limits
                expect(authMax).toBeLessThanOrEqual(globalMax);

                // Both should have reasonable ratios (requests per minute)
                const globalRequestsPerMinute = globalMax / (globalWindow / 60000);
                const authRequestsPerMinute = authMax / (authWindow / 60000);

                expect(globalRequestsPerMinute).toBeGreaterThan(0);
                expect(authRequestsPerMinute).toBeGreaterThan(0);
            });
        });
    });

    describe('Runtime Configuration Validation', () => {
        it('should handle missing environment variables gracefully', () => {
            // Simular variables de entorno faltantes
            const originalValue = envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION;

            // Temporary mock missing value
            Object.defineProperty(envs, 'RATE_LIMIT_GLOBAL_MAX_PRODUCTION', {
                value: 0,
                configurable: true
            });

            // El sistema debería tener valores por defecto o manejar esto apropiadamente
            expect(() => {
                const { RateLimitMiddleware } = require('../../../src/presentation/middlewares/rate-limit.middleware');
                RateLimitMiddleware.getCurrentConfig();
            }).not.toThrow();

            // Restaurar valor original
            Object.defineProperty(envs, 'RATE_LIMIT_GLOBAL_MAX_PRODUCTION', {
                value: originalValue,
                configurable: true
            });
        });

        it('should validate that window values are in milliseconds', () => {
            // Verificar que los valores de ventana parecen estar en milisegundos
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION).toBeGreaterThan(60000); // > 1 min
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT).toBeGreaterThan(30000); // > 30 sec
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_TEST).toBeGreaterThan(10000); // > 10 sec

            expect(envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION).toBeGreaterThan(60000); // > 1 min
            expect(envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT).toBeGreaterThan(30000); // > 30 sec
            expect(envs.RATE_LIMIT_AUTH_WINDOW_TEST).toBeGreaterThan(10000); // > 10 sec
        });

        it('should have reasonable maximum values to prevent memory issues', () => {
            // Prevenir configuraciones extremas que podrían causar problemas de memoria
            expect(envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION).toBeLessThan(50000);
            expect(envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT).toBeLessThan(100000);
            expect(envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBeLessThan(200000);

            expect(envs.RATE_LIMIT_AUTH_MAX_PRODUCTION).toBeLessThan(1000);
            expect(envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT).toBeLessThan(5000);
            expect(envs.RATE_LIMIT_AUTH_MAX_TEST).toBeLessThan(10000);
        });
    });

    describe('Configuration Documentation', () => {
        it('should have expected values matching documentation', () => {
            // Verificar que los valores actuales coinciden con la documentación
            expect(envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION).toBe(1000);
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION).toBe(900000); // 15 min
            expect(envs.RATE_LIMIT_AUTH_MAX_PRODUCTION).toBe(10);
            expect(envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION).toBe(3600000); // 1 hour

            expect(envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT).toBe(5000);
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT).toBe(60000); // 1 min
            expect(envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT).toBe(100);
            expect(envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT).toBe(900000); // 15 min

            expect(envs.RATE_LIMIT_GLOBAL_MAX_TEST).toBe(10000);
            expect(envs.RATE_LIMIT_GLOBAL_WINDOW_TEST).toBe(60000); // 1 min
            expect(envs.RATE_LIMIT_AUTH_MAX_TEST).toBe(1000);
            expect(envs.RATE_LIMIT_AUTH_WINDOW_TEST).toBe(60000); // 1 min
        });

        it('should convert window values to minutes correctly', () => {
            // Verificar conversión de milisegundos a minutos
            expect(Math.ceil(envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION / 60000)).toBe(15);
            expect(Math.ceil(envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION / 60000)).toBe(60);

            expect(Math.ceil(envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT / 60000)).toBe(1);
            expect(Math.ceil(envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT / 60000)).toBe(15);

            expect(Math.ceil(envs.RATE_LIMIT_GLOBAL_WINDOW_TEST / 60000)).toBe(1);
            expect(Math.ceil(envs.RATE_LIMIT_AUTH_WINDOW_TEST / 60000)).toBe(1);
        });
    });
});
