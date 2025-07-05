import express, { Router, Request, Response, NextFunction } from "express"
import { MainRoutes } from "./routes"
import { RateLimitMiddleware } from "./middlewares/rate-limit.middleware"
import { LoggerMiddleware } from "./middlewares/logger.middleware" // Importamos el middleware
import logger from "../configs/logger" // Importamos el logger
import { MorganLogger } from "../configs/morgan.config" // Importamos Morgan logger
import cors from "cors"
import { envs } from "../configs/envs"
import path from "path"
import { Server } from "http"

interface IOptions {
    p_port: number,
    p_routes: Router
}

export class server {
    public readonly app = express()
    public readonly port: number
    public readonly routes: Router
    private httpServer?: Server

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

        // Apply logging middleware first (generates request ID)
        this.app.use(LoggerMiddleware.getLoggerMiddleware());

        // Configure Morgan for detailed HTTP logging
        const morganLogger = new MorganLogger({
            logger: logger,
            environment: envs.NODE_ENV
        });

        // Apply Morgan middleware for detailed HTTP request/response logging
        if (envs.NODE_ENV === 'production') {
            // Use simple middleware for production to avoid socket issues
            this.app.use(morganLogger.getSimpleMiddleware());
        } else {
            // Use complete middleware for development/test
            const morganMiddlewares = morganLogger.getCompleteMiddleware();
            morganMiddlewares.forEach(middleware => {
                this.app.use(middleware);
            });
        }

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
    } 

    async start() {
        try {
            console.log('[SERVER] Starting server...');
            logger.info("[SERVER] Starting server", { port: this.port, environment: envs.NODE_ENV });

            // Create logs directory if it doesn't exist
            try {
                const fs = require('fs');
                const logsDir = path.join(process.cwd(), 'logs');
                if (!fs.existsSync(logsDir)) {
                    fs.mkdirSync(logsDir, { recursive: true });
                    console.log('[SERVER] Logs directory created:', logsDir);
                    logger.info(`Directorio de logs creado: ${logsDir}`);
                }
            } catch (error) {
                console.error('[SERVER] Could not create logs directory:', error);
                logger.warn("No se pudo crear el directorio de logs", { error });
            }

            console.log('[SERVER] Starting HTTP server on port:', this.port);
            logger.info('[SERVER] Starting HTTP server', { port: this.port });

            // Start the server
            this.httpServer = this.app.listen(this.port, () => {
                console.log(`🚀 [SERVER] Server running successfully on port ${this.port} (Environment: ${envs.NODE_ENV})`);
                logger.info(`🚀 Servidor corriendo exitosamente en puerto ${this.port} (Entorno: ${envs.NODE_ENV})`);
            });

            // Add error handler for the HTTP server
            this.httpServer.on('error', (error: any) => {
                console.error('[SERVER] HTTP Server error:', error);
                logger.error('[SERVER] HTTP Server error', { error: error.message, code: error.code });
                
                if (error.code === 'EADDRINUSE') {
                    console.error(`[SERVER] Port ${this.port} is already in use`);
                    logger.error(`Port ${this.port} is already in use`);
                }
                process.exit(1);
            });

            console.log('[SERVER] HTTP server listener attached');
            logger.info('[SERVER] HTTP server listener attached');

        } catch (error) {
            console.error('[SERVER] Error starting server:', error);
            logger.error('Error al iniciar el servidor', { error });
            process.exit(1);
        }
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.httpServer) {
                this.httpServer.close((err) => {
                    if (err) {
                        logger.error('Error cerrando el servidor', { error: err });
                        reject(err);
                    } else {
                        logger.info('Servidor cerrado exitosamente');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}