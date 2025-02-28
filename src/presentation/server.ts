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

        // Configurar Express para confiar en los proxies de ngrok  
        // this.app.set('trust proxy', true);

        
         // Opción 1: Si estás en desarrollo con ngrok
        if (envs.NODE_ENV === 'development') {
            console.log('Configurando trust proxy para entorno de desarrollo');
            // Opción menos restrictiva para desarrollo, pero desactiva la validación estricta de express-rate-limit
            this.app.set('trust proxy', true);
            
            // Especifica esta opción al crear tus rate limiters para evitar el error
            const rateLimitOptions = {
                validate: { trustProxy: false }  // Desactiva la validación de trust proxy
            };
            
            // Aplica estos rateLimitOptions al crear tus limitadores
            // Por ejemplo:
            // this.app.use(RateLimitMiddleware.getGlobalRateLimit(rateLimitOptions));
        } else {
            // Opción 2: Para producción, especifica IPs o rangos confiables
            console.log('Configurando trust proxy para entorno de producción');
            this.app.set('trust proxy', 'loopback, linklocal, uniquelocal');
        }


        // Aplicamos el rate limit global antes de cualquier otro middleware
        this.app.use(RateLimitMiddleware.getGlobalRateLimit());

        this.app.use(cors({
            origin: '*', // En producción, restringe esto
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));


        //middleware permitir que express entienda json

        //express.json es para recibir raw en el body o 
        //enviar raw
        this.app.use(express.json())

        //es para que express permita entender urlencoded
        this.app.use(express.urlencoded({extended: true}))
        
        //middleware usar las rutas definidas
        this.app.use(this.routes)

        //escuchar el puerto definido
        this.app.listen(this.port, ()=>{
            console.log("server running on port", this.port)
        })

    }

}