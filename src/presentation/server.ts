import express, { Router } from "express"
import { MainRoutes } from "./routes"
import { RateLimitMiddleware } from "./middlewares/rate-limit.middleware"
import cors from "cors"

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