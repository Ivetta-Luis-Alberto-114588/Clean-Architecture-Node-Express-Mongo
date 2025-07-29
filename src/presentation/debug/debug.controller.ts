import { Request, Response } from 'express';
import { Router } from 'express';
import { envs } from '../../configs/envs';
import { RateLimitMiddleware } from '../middlewares/rate-limit.middleware';

export class DebugController {

    static getDebugRoutes(): Router {
        const router = Router();

        // Solo disponible en desarrollo
        if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
            router.get('/debug-ip', this.getIPInfo);
            router.get('/debug-headers', this.getHeaders);
            router.get('/debug-config', this.getConfig);
        }

        return router;
    }

    static getConfig = (req: Request, res: Response) => {
        const rateLimitConfig = RateLimitMiddleware.getCurrentConfig();

        res.json({
            NODE_ENV: envs.NODE_ENV,
            nodeEnvFromProcess: process.env.NODE_ENV,
            trustProxy: req.app.get('trust proxy'),
            timestamp: new Date().toISOString(),
            rateLimitingStatus: {
                shouldBeActive: envs.NODE_ENV !== 'test' ||
                    (envs.RATE_LIMIT_GLOBAL_MAX_TEST > 0 && envs.RATE_LIMIT_AUTH_MAX_TEST > 0),
                currentEnvironment: envs.NODE_ENV,
                configuration: rateLimitConfig
            }
        });
    };

    static getIPInfo = (req: Request, res: Response) => {
        const ipInfo = {
            detectedIP: req.ip,
            forwardedFor: req.headers['x-forwarded-for'],
            realIP: req.headers['x-real-ip'],
            remoteAddress: req.connection?.remoteAddress,
            socketRemoteAddress: req.socket?.remoteAddress,
            trustProxy: req.app.get('trust proxy'),
            timestamp: new Date().toISOString()
        };

        res.json(ipInfo);
    };

    static getHeaders = (req: Request, res: Response) => {
        res.json({
            headers: req.headers,
            connection: {
                remoteAddress: req.connection?.remoteAddress,
                remotePort: req.connection?.remotePort
            },
            socket: {
                remoteAddress: req.socket?.remoteAddress,
                remotePort: req.socket?.remotePort
            }
        });
    };
}
