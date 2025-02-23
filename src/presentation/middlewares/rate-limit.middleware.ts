import rateLimit from "express-rate-limit";
import { CustomError } from "../../domain/errors/custom.error";
import { Request, Response, NextFunction } from 'express';

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

// Creamos las instancias de rate limit durante la inicialización
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Límite de 10 solicitudes por windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            error: 'Límite de solicitudes excedido',
            message: 'Has excedido el límite de solicitudes globales. Por favor, espera 15 minutos.',
            statusCode: 429
        });
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 intentos máximos
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        // Calculamos el tiempo restante de manera segura
        const resetTime = req.rateLimit?.resetTime || new Date(Date.now() + 60 * 60 * 1000);
        const remainingMinutes = Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60);

        res.status(429).json({
            error: 'Límite de intentos excedido',
            message: 'Has excedido el límite de intentos de inicio de sesión. Por favor, espera una hora.',
            statusCode: 429,
            remainingTime: `${remainingMinutes} minutos`,
            intentosRestantes: req.rateLimit?.remaining || 0
        });
    },
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for']?.toString() || 'default-ip';
    }
});

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
        return globalLimiter;
    }

    static getAuthRateLimit() {
        return authLimiter;
    }

    static getErrorHandler() {
        return errorHandler;
    }
}