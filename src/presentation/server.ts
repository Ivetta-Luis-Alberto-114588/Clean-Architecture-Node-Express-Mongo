import express, { Router } from "express"
import { MainRoutes } from "./routes"
import { RateLimitMiddleware } from "./middlewares/rate-limit.middleware"
import cors from "cors"
import { envs } from "../configs/envs"

interface IOptions {
    p_port: number,
    p_routes: Router
}

export class server {
    public readonly app = express()
    private readonly port : number
    private readonly routes: Router

    constructor(options: IOptions){
        const {p_port, p_routes} = options
        
        this.port = p_port
        this.routes = p_routes
    }

    async start(){
        // Configurar la confianza en proxies según el entorno
        if (envs.NODE_ENV === 'development' || envs.NODE_ENV === 'test') {
            console.log('Configurando trust proxy para entorno de desarrollo/test');
            this.app.set('trust proxy', true);
        } else {
            console.log('Configurando trust proxy para entorno de producción');
            this.app.set('trust proxy', 'loopback, linklocal, uniquelocal');
        }

        // Aplicar el rate limit según el entorno - se configurará automáticamente
        this.app.use(RateLimitMiddleware.getGlobalRateLimit());

        // Configurar CORS
        this.app.use(cors({
            origin: '*', // En producción, restringe esto
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // Middleware para analizar JSON
        this.app.use(express.json())

        // Middleware para analizar URL codificadas
        this.app.use(express.urlencoded({extended: true}))
        
        // Usar las rutas definidas
        this.app.use(this.routes)

        // Iniciar el servidor
        this.app.listen(this.port, () => {
            console.log(`Servidor corriendo en puerto ${this.port} (Entorno: ${envs.NODE_ENV})`);
        })
    }
}