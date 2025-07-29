import rateLimit from "express-rate-limit";
import { CustomError } from "../../domain/errors/custom.error";
import { Request, Response, NextFunction } from 'express';
import { envs } from "../../configs/envs";

// Extendemos la interfaz Request para incluir las propiedades de rate-limit
declare global {
    namespace Express {
        interface Request {
            rateLimit?: {
                limit: number;
                current: number;
                remaining: number;
                resetTime: Date;
            };
        }
    }
}

// Función para crear el limitador global con configuración según entorno
const createGlobalLimiter = () => {
    let windowMs: number;
    let max: number;

    // Configuración según entorno usando variables de entorno
    switch (envs.NODE_ENV) {
        case 'production':
            windowMs = envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION;
            max = envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION;
            break;
        case 'development':
            windowMs = envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT;
            max = envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT;
            break;
        case 'test':
            windowMs = envs.RATE_LIMIT_GLOBAL_WINDOW_TEST;
            max = envs.RATE_LIMIT_GLOBAL_MAX_TEST;
            break;
        default:
            // Fallback a valores de desarrollo
            windowMs = envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT;
            max = envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT;
    }

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: Request, res: Response) => {
            res.status(429).json({
                error: 'Límite de solicitudes excedido',
                message: `Has excedido el límite de solicitudes globales. Por favor, espera ${Math.ceil(windowMs / 60000)} minutos.`,
                statusCode: 429,
                debug: envs.NODE_ENV === 'development' ? {
                    environment: envs.NODE_ENV,
                    limit: max,
                    windowMs: `${Math.ceil(windowMs / 60000)} minutos`
                } : undefined
            });
        }
    });
};

// Función para crear el limitador de autenticación con configuración según entorno
const createAuthLimiter = () => {
    let windowMs: number;
    let max: number;

    // Configuración según entorno usando variables de entorno
    switch (envs.NODE_ENV) {
        case 'production':
            windowMs = envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION;
            max = envs.RATE_LIMIT_AUTH_MAX_PRODUCTION;
            break;
        case 'development':
            windowMs = envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT;
            max = envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT;
            break;
        case 'test':
            windowMs = envs.RATE_LIMIT_AUTH_WINDOW_TEST;
            max = envs.RATE_LIMIT_AUTH_MAX_TEST;
            break;
        default:
            // Fallback a valores de desarrollo
            windowMs = envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT;
            max = envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT;
    }

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req: Request, res: Response) => {
            const resetTime = req.rateLimit?.resetTime || new Date(Date.now() + windowMs);
            const remainingMinutes = Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60);

            res.status(429).json({
                error: 'Límite de intentos excedido',
                message: `Has excedido el límite de intentos de inicio de sesión. Por favor, espera ${Math.ceil(windowMs / 60000)} minutos.`,
                statusCode: 429,
                remainingTime: `${remainingMinutes} minutos`,
                intentosRestantes: req.rateLimit?.remaining || 0,
                debug: envs.NODE_ENV === 'development' ? {
                    environment: envs.NODE_ENV,
                    limit: max,
                    windowMs: `${Math.ceil(windowMs / 60000)} minutos`
                } : undefined
            });
        },
        keyGenerator: (req) => {
            // Intentar obtener la IP real de varias fuentes
            const forwardedFor = req.headers['x-forwarded-for'];
            const realIP = req.headers['x-real-ip'];
            const clientIP = req.ip;

            let finalIP = clientIP;

            if (forwardedFor) {
                // x-forwarded-for puede contener múltiples IPs separadas por coma
                finalIP = Array.isArray(forwardedFor)
                    ? forwardedFor[0]
                    : forwardedFor.split(',')[0].trim();
            } else if (realIP) {
                finalIP = Array.isArray(realIP) ? realIP[0] : realIP;
            }

            // Si aún no tenemos IP, usar la IP de conexión
            if (!finalIP || finalIP === '::1' || finalIP === '127.0.0.1') {
                finalIP = req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown-ip';
            }

            return finalIP;
        }
    });
};

// Middleware para manejar errores generales
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            error: err.message,
            statusCode: err.statusCode
        });
    }

    console.error('Error no manejado:', err);
    return res.status(500).json({
        error: 'Error interno del servidor',
        statusCode: 500
    });
};

export class RateLimitMiddleware {
    static getGlobalRateLimit(forceEnable: boolean = false) {
        // En modo test, podemos deshabilitar completamente si los límites son 0
        if (envs.NODE_ENV === 'test' && !forceEnable) {
            // Si los valores de test son 0, deshabilitar completamente
            if (envs.RATE_LIMIT_GLOBAL_MAX_TEST === 0) {
                return (req: Request, res: Response, next: NextFunction) => next();
            }
        }

        return createGlobalLimiter();
    }

    static getAuthRateLimit(forceEnable: boolean = false) {
        // En modo test, podemos deshabilitar completamente si los límites son 0
        if (envs.NODE_ENV === 'test' && !forceEnable) {
            // Si los valores de test son 0, deshabilitar completamente
            if (envs.RATE_LIMIT_AUTH_MAX_TEST === 0) {
                return (req: Request, res: Response, next: NextFunction) => next();
            }
        }

        return createAuthLimiter();
    }

    static getErrorHandler() {
        return errorHandler;
    }

    // Método útil para obtener la configuración actual
    static getCurrentConfig() {
        const env = envs.NODE_ENV;

        let globalConfig, authConfig;

        switch (env) {
            case 'production':
                globalConfig = {
                    max: envs.RATE_LIMIT_GLOBAL_MAX_PRODUCTION,
                    windowMs: envs.RATE_LIMIT_GLOBAL_WINDOW_PRODUCTION
                };
                authConfig = {
                    max: envs.RATE_LIMIT_AUTH_MAX_PRODUCTION,
                    windowMs: envs.RATE_LIMIT_AUTH_WINDOW_PRODUCTION
                };
                break;
            case 'development':
                globalConfig = {
                    max: envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT,
                    windowMs: envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT
                };
                authConfig = {
                    max: envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT,
                    windowMs: envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT
                };
                break;
            case 'test':
                globalConfig = {
                    max: envs.RATE_LIMIT_GLOBAL_MAX_TEST,
                    windowMs: envs.RATE_LIMIT_GLOBAL_WINDOW_TEST
                };
                authConfig = {
                    max: envs.RATE_LIMIT_AUTH_MAX_TEST,
                    windowMs: envs.RATE_LIMIT_AUTH_WINDOW_TEST
                };
                break;
            default:
                globalConfig = {
                    max: envs.RATE_LIMIT_GLOBAL_MAX_DEVELOPMENT,
                    windowMs: envs.RATE_LIMIT_GLOBAL_WINDOW_DEVELOPMENT
                };
                authConfig = {
                    max: envs.RATE_LIMIT_AUTH_MAX_DEVELOPMENT,
                    windowMs: envs.RATE_LIMIT_AUTH_WINDOW_DEVELOPMENT
                };
        }

        return {
            environment: env,
            global: {
                ...globalConfig,
                windowMinutes: Math.ceil(globalConfig.windowMs / 60000)
            },
            auth: {
                ...authConfig,
                windowMinutes: Math.ceil(authConfig.windowMs / 60000)
            }
        };
    }
}