import { Request, Response, NextFunction } from 'express';
// No importar RateLimitMiddleware aquí, se importará dinámicamente en cada test según el entorno

// Mock de express-rate-limit
const mockRateLimit = jest.fn(() => (req: any, res: any, next: any) => next());

jest.mock('express-rate-limit', () => {
    return jest.fn(() => mockRateLimit);
});

// Mock de envs
jest.mock('../../../../src/configs/envs', () => ({
    envs: {
        NODE_ENV: 'test',
        RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
        RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
        RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
        RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000,
        RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT: 5000,
        RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT: 60000,
        RATE_LIMIT_AUTH_MAX_DEVELOPMENT: 100,
        RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT: 900000,
        RATE_LIMIT_GLOBAL_MAX_TEST: 10000,
        RATE_LIMIT_GLOBAL_WINDOW_TEST: 60000,
        RATE_LIMIT_AUTH_MAX_TEST: 1000,
        RATE_LIMIT_AUTH_WINDOW_TEST: 60000
    }
}));

describe('RateLimitMiddleware', () => {
    let mockReq: any;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {
            ip: '127.0.0.1',
            headers: {},
            connection: { remoteAddress: '127.0.0.1' },
            app: {
                get: jest.fn().mockReturnValue(true)
            }
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            end: jest.fn()
        };

        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('Environment Configuration', () => {
        it('should return correct configuration for production environment', () => {
            jest.resetModules();
            process.env.NODE_ENV = 'production';
            jest.doMock('../../../../src/configs/envs', () => ({
                envs: {
                    NODE_ENV: 'production',
                    RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                    RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                    RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                    RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
                }
            }));
            const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
            const config = RateLimitMiddleware.getCurrentConfig();
            expect(config).toEqual({
                environment: 'production',
                global: {
                    max: 1000,
                    windowMs: 900000,
                    windowMinutes: 15
                },
                auth: {
                    max: 10,
                    windowMs: 3600000,
                    windowMinutes: 60
                }
            });
            jest.dontMock('../../../../src/configs/envs');
        });
    });
});

describe('Middleware Creation', () => {
    it('should create global rate limit middleware with correct configuration', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const middleware = RateLimitMiddleware.getGlobalRateLimit();
        expect(middleware).toBeDefined();
        expect(typeof middleware).toBe('function');
        jest.dontMock('../../../../src/configs/envs');
    });

    it('should create auth rate limit middleware with correct configuration', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const middleware = RateLimitMiddleware.getAuthRateLimit();
        expect(middleware).toBeDefined();
        expect(typeof middleware).toBe('function');
        jest.dontMock('../../../../src/configs/envs');
    });

    it('should force enable global rate limit when requested', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const middleware = RateLimitMiddleware.getGlobalRateLimit(true);
        expect(middleware).toBeDefined();
        expect(typeof middleware).toBe('function');
        jest.dontMock('../../../../src/configs/envs');
    });

    it('should force enable auth rate limit when requested', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const middleware = RateLimitMiddleware.getAuthRateLimit(true);
        expect(middleware).toBeDefined();
        expect(typeof middleware).toBe('function');
        jest.dontMock('../../../../src/configs/envs');
    });
});

describe('Error Handler', () => {
    it('should return function that handles rate limit errors', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const errorHandler = RateLimitMiddleware.getErrorHandler();
        expect(errorHandler).toBeDefined();
        expect(typeof errorHandler).toBe('function');
        jest.dontMock('../../../../src/configs/envs');
    });
});

describe('Configuration Retrieval', () => {
    it('should return current configuration object', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const config = RateLimitMiddleware.getCurrentConfig();
        expect(config).toBeDefined();
        expect(config).toHaveProperty('environment');
        expect(config).toHaveProperty('global');
        expect(config).toHaveProperty('auth');
        expect(config.global).toHaveProperty('max');
        expect(config.global).toHaveProperty('windowMs');
        expect(config.global).toHaveProperty('windowMinutes');
        expect(config.auth).toHaveProperty('max');
        expect(config.auth).toHaveProperty('windowMs');
        expect(config.auth).toHaveProperty('windowMinutes');
        jest.dontMock('../../../../src/configs/envs');
    });
});

describe('Environment Variable Dependency', () => {
    it('should use environment variables for production configuration', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const config = RateLimitMiddleware.getCurrentConfig();
        expect(config.global.max).toBe(1000);
        expect(config.global.windowMs).toBe(900000);
        expect(config.auth.max).toBe(10);
        expect(config.auth.windowMs).toBe(3600000);
        jest.dontMock('../../../../src/configs/envs');
    });
});

describe('Window Minutes Calculation', () => {
    it('should correctly calculate window minutes for production', () => {
        jest.resetModules();
        process.env.NODE_ENV = 'production';
        jest.doMock('../../../../src/configs/envs', () => ({
            envs: {
                NODE_ENV: 'production',
                RATE_LIMIT_GLOBAL_MAX_PRODUCTION: 1000,
                RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION: 900000,
                RATE_LIMIT_AUTH_MAX_PRODUCTION: 10,
                RATE_LIMIT_AUTH_WINDOW_PRODUCTION: 3600000
            }
        }));
        const { RateLimitMiddleware } = require('../../../../src/presentation/middlewares/rate-limit.middleware');
        const config = RateLimitMiddleware.getCurrentConfig();
        expect(config.global.windowMinutes).toBe(15);
        expect(config.auth.windowMinutes).toBe(60);
        jest.dontMock('../../../../src/configs/envs');
    });
});
;
