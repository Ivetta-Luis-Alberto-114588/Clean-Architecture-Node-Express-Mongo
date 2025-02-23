import rateLimit from "express-rate-limit";
import { CustomError } from "../../domain/errors/custom.error";
import { Response } from 'express';

export class RateLimitMiddleware {
    // Configuración general para toda la API 
    static getGlobalRateLimit() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 10, // Límite de 10 solicitudes por windowMs
            message: {
                error: 'Demasiadas solicitudes, por favor intente más tarde'
            },
            standardHeaders: true,
            legacyHeaders: false,
            // Personalizamos el handler para mantener consistencia con nuestros errores
            handler: (req, res) => {
                throw CustomError.tooManyRequests('Límite de solicitudes excedido');
            }
        });
    }

    // Configuración específica para autenticación
    static getAuthRateLimit() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hora
            max: 3, // 3 intentos máximos
            message: {
                error: 'Has excedido el límite de intentos de inicio de sesión. Por favor, espera una hora.'
            },
            standardHeaders: true,
            legacyHeaders: false,
            // Handler personalizado para manejar cuando se excede el límite
            handler: (req, res: Response) => {
                res.status(429).json({
                    error: 'Límite de intentos excedido',
                    message: 'Has superado el número máximo de intentos de inicio de sesión',
                    waitTime: '1 hora',
                    maxAttempts: 3
                });
            },
            // Crucial: No saltarse las solicitudes fallidas
            skipFailedRequests: false,
            // Opcional: Saltar solicitudes exitosas
            skipSuccessfulRequests: false,
            // Identificador único para cada usuario (usando IP por defecto)
            keyGenerator: (req) => {
                // Aseguramos que siempre devolvamos un string válido
                return req.ip || req.headers['x-forwarded-for']?.toString() || 'default-ip';
            }
        });
    }
}