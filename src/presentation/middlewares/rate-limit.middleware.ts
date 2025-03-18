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
    // Valores predeterminados para producción
    let windowMs = 15 * 60 * 1000; // 15 minutos
    let max = 1000; // 1000 solicitudes por ventana

    // Valores más permisivos para entorno de desarrollo/test
    if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
        windowMs = 1 * 60 * 1000; // 1 minuto
        max = 5000; // 5000 solicitudes por ventana
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
                statusCode: 429
            });
        }
    });
};

// Función para crear el limitador de autenticación con configuración según entorno
const createAuthLimiter = () => {
    // Valores predeterminados para producción
    let windowMs = 60 * 60 * 1000; // 1 hora
    let max = 5; // 5 intentos máximos por hora

    // Valores más permisivos para entorno de desarrollo/test
    if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
        windowMs = 10 * 60 * 1000; // 10 minutos
        max = 100; // 100 intentos máximos
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
                intentosRestantes: req.rateLimit?.remaining || 0
            });
        },
        keyGenerator: (req) => {
            return req.ip || req.headers['x-forwarded-for']?.toString() || 'default-ip';
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
    static getGlobalRateLimit() {
        // Si estamos en modo test, retornamos un middleware vacío
        if (envs.NODE_ENV === 'test') {
            return (req: Request, res: Response, next: NextFunction) => next();
        }
        
        return createGlobalLimiter();
    }

    static getAuthRateLimit() {
        // Si estamos en modo test, retornamos un middleware vacío
        if (envs.NODE_ENV === 'test') {
            return (req: Request, res: Response, next: NextFunction) => next();
        }
        
        return createAuthLimiter();
    }

    static getErrorHandler() {
        return errorHandler;
    }
}