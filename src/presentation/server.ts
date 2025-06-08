import express, { Router, Request, Response, NextFunction } from "express"
import { MainRoutes } from "./routes"
import { RateLimitMiddleware } from "./middlewares/rate-limit.middleware"
import { LoggerMiddleware } from "./middlewares/logger.middleware" // Importamos el middleware
import logger from "../configs/logger" // Importamos el logger
import cors from "cors"
import { envs } from "../configs/envs"
import path from "path"

interface IOptions {
    p_port: number,
    p_routes: Router
}

export class server {
    public readonly app = express()
    public readonly port: number
    public readonly routes: Router

    constructor(options: IOptions) {
        const { p_port, p_routes } = options

        this.port = p_port
        this.routes = p_routes

        // Set up the app for testing
        this.setupApp();
    }

    private setupApp() {
        // Configure trust proxy based on environment
        if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
            this.app.set('trust proxy', true);
        } else {
            this.app.set('trust proxy', 'loopback, linklocal, uniquelocal');
        }

        // Apply logging middleware first
        this.app.use(LoggerMiddleware.getLoggerMiddleware());

        // Apply rate limiting
        this.app.use(RateLimitMiddleware.getGlobalRateLimit());

        // CORS configuration
        const corsOptions: cors.CorsOptions = {
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            credentials: true
        };

        if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
            corsOptions.origin = '*';
        } else {
            corsOptions.origin = '*';
        }

        this.app.use(cors(corsOptions));

        // Middleware for parsing JSON
        this.app.use(express.json({
            limit: '10mb'
        }));

        // Middleware for parsing URL-encoded data
        this.app.use(express.urlencoded({
            extended: true,
            limit: '10mb'
        }));

        // Use defined routes
        this.app.use(this.routes);

        // 404 middleware
        this.app.use((req: Request, res: Response) => {
            logger.warn(`Ruta no encontrada: ${req.method} ${req.url}`, {
                requestId: req.id
            });
            res.status(404).json({ error: 'Ruta no encontrada' });
        });

        // Error logging middleware
        this.app.use(LoggerMiddleware.getErrorLoggerMiddleware());

        // Global error handling middleware
        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            const statusCode = err.statusCode || 500;
            const message = err.message || 'Error interno del servidor';

            res.status(statusCode).json({
                error: message,
                statusCode
            });
        });
    } async start() {
        try {
            logger.info("Iniciando servidor...");

            // Create logs directory if it doesn't exist
            try {
                const fs = require('fs');
                const logsDir = path.join(process.cwd(), 'logs');
                if (!fs.existsSync(logsDir)) {
                    fs.mkdirSync(logsDir, { recursive: true });
                    logger.info(`Directorio de logs creado: ${logsDir}`);
                }
            } catch (error) {
                logger.warn("No se pudo crear el directorio de logs", { error });
            }

            // Start the server
            this.app.listen(this.port, () => {
                logger.info(`🚀 Servidor corriendo exitosamente en puerto ${this.port} (Entorno: ${envs.NODE_ENV})`);
            });

        } catch (error) {
            logger.error('Error al iniciar el servidor', { error });
            process.exit(1);
        }
    }
}