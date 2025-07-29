import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from 'express';
import { envs } from "../../configs/envs";
import logger from "../../configs/logger";

// Middleware de debugging para rate limiting
export const debugRateLimit = (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip;
    const forwardedFor = req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    logger.info('Rate Limit Debug Info', {
        clientIP,
        forwardedFor,
        userAgent: userAgent?.substring(0, 100),
        url: req.url,
        method: req.method,
        trustProxy: req.app.get('trust proxy'),
        connection: {
            remoteAddress: req.connection?.remoteAddress,
            remotePort: req.connection?.remotePort
        }
    });

    next();
};

// Función para crear el limitador global con debugging mejorado
export const createDebugGlobalLimiter = () => {
    let windowMs = 15 * 60 * 1000; // 15 minutos
    let max = 1000; // 1000 solicitudes por ventana

    if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
        windowMs = 1 * 60 * 1000; // 1 minuto
        max = 5000; // 5000 solicitudes por ventana
    }

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'default-ip';

            logger.warn('Rate Limit Key Generation', {
                generatedKey: key,
                requestIP: req.ip,
                forwardedFor: req.headers['x-forwarded-for'],
                url: req.url
            });

            return key;
        },
        handler: (req: Request, res: Response) => {
            const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'default-ip';

            logger.error('Rate Limit Exceeded - Global', {
                key,
                ip: req.ip,
                forwardedFor: req.headers['x-forwarded-for'],
                url: req.url,
                method: req.method,
                userAgent: req.headers['user-agent']?.substring(0, 100),
                limit: max,
                windowMs: Math.ceil(windowMs / 60000) + ' minutes',
                resetTime: req.rateLimit?.resetTime,
                remaining: req.rateLimit?.remaining
            });

            res.status(429).json({
                error: 'Límite de solicitudes excedido',
                message: `Has excedido el límite de solicitudes globales. Por favor, espera ${Math.ceil(windowMs / 60000)} minutos.`,
                statusCode: 429,
                debug: envs.NODE_ENV === 'development' ? {
                    key,
                    limit: max,
                    windowMs: Math.ceil(windowMs / 60000) + ' minutes'
                } : undefined
            });
        }
    });
};

// Función para crear el limitador de autenticación con debugging mejorado
export const createDebugAuthLimiter = () => {
    let windowMs = 60 * 60 * 1000; // 1 hora
    let max = 5; // 5 intentos máximos por hora

    if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
        windowMs = 10 * 60 * 1000; // 10 minutos
        max = 100; // 100 intentos máximos
    }

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'default-ip';

            logger.warn('Rate Limit Key Generation - Auth', {
                generatedKey: key,
                requestIP: req.ip,
                forwardedFor: req.headers['x-forwarded-for'],
                url: req.url,
                body: req.body?.email ? { email: req.body.email } : undefined
            });

            return key;
        },
        handler: (req: Request, res: Response) => {
            const resetTime = req.rateLimit?.resetTime || new Date(Date.now() + windowMs);
            const remainingMinutes = Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60);
            const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'default-ip';

            logger.error('Rate Limit Exceeded - Auth', {
                key,
                ip: req.ip,
                forwardedFor: req.headers['x-forwarded-for'],
                url: req.url,
                method: req.method,
                userAgent: req.headers['user-agent']?.substring(0, 100),
                email: req.body?.email,
                limit: max,
                windowMs: Math.ceil(windowMs / 60000) + ' minutes',
                remainingMinutes,
                resetTime: resetTime.toISOString(),
                remaining: req.rateLimit?.remaining
            });

            res.status(429).json({
                error: 'Límite de intentos excedido',
                message: `Has excedido el límite de intentos de inicio de sesión. Por favor, espera ${Math.ceil(windowMs / 60000)} minutos.`,
                statusCode: 429,
                remainingTime: `${remainingMinutes} minutos`,
                intentosRestantes: req.rateLimit?.remaining || 0,
                debug: envs.NODE_ENV === 'development' ? {
                    key,
                    limit: max,
                    windowMs: Math.ceil(windowMs / 60000) + ' minutes',
                    resetTime: resetTime.toISOString()
                } : undefined
            });
        }
    });
};
