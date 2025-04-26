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
    private readonly port: number
    private readonly routes: Router

    constructor(options: IOptions) {
        const { p_port, p_routes } = options

        this.port = p_port
        this.routes = p_routes
    }

    async start() {
        try {
            logger.info("Iniciando servidor...");

            // Crear directorio de logs si no existe
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

            // Configurar la confianza en proxies según el entorno
            if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
                logger.debug('Configurando trust proxy para entorno de desarrollo/test');
                this.app.set('trust proxy', true);
            } else {
                logger.info('Configurando trust proxy para entorno de producción');
                this.app.set('trust proxy', 'loopback, linklocal, uniquelocal');
            }



            // Aplicar el middleware de logging antes que cualquier otro middleware
            this.app.use(LoggerMiddleware.getLoggerMiddleware());



            // Aplicar el rate limit según el entorno
            this.app.use(RateLimitMiddleware.getGlobalRateLimit());



            // Configurar CORS
            this.app.use(cors({
                origin: envs.FRONTEND_URL || '*', // Usar variable de entorno!
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // <-- AÑADIR PATCH y OPTIONS
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Añadir otros comunes si es necesario
                credentials: true // Importante si usas Authorization header o cookies
            }));
            logger.info(`CORS habilitado para origen: ${envs.FRONTEND_URL || '*'}`);



            // Middleware para analizar JSON
            this.app.use(express.json({
                limit: '10mb' // Límite de tamaño para prevenir ataques
            }));



            // Middleware para analizar URL codificadas
            this.app.use(express.urlencoded({
                extended: true,
                limit: '10mb'
            }));



            // Usar las rutas definidas
            this.app.use(this.routes);



            // Middleware para manejar 404
            this.app.use((req: Request, res: Response) => {
                logger.warn(`Ruta no encontrada: ${req.method} ${req.url}`, {
                    requestId: req.id
                });
                res.status(404).json({ error: 'Ruta no encontrada' });
            });



            // Middleware para log de errores (debe ir después de las rutas)
            this.app.use(LoggerMiddleware.getErrorLoggerMiddleware());



            // Middleware para manejo global de errores
            this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
                const statusCode = err.statusCode || 500;
                const message = err.message || 'Error interno del servidor';

                res.status(statusCode).json({
                    error: message,
                    statusCode
                });
            });



            // Iniciar el servidor
            this.app.listen(this.port, () => {
                logger.info(`🚀 Servidor corriendo exitosamente en puerto ${this.port} (Entorno: ${envs.NODE_ENV})`);
            });


        } catch (error) {

            logger.error('Error al iniciar el servidor', { error });
            process.exit(1);
        }
    }
}