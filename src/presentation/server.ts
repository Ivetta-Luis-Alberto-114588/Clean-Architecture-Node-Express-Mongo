import express, { Router } from "express"
import { MainRoutes } from "./routes"

interface IOptions {
    p_port: number,
    p_routes: Router
}


export class server {

    public readonly app = express()
    private readonly port : number
    private readonly route: Router

    constructor(options: IOptions){
        const {p_port, p_routes} = options
        
        this.port = p_port
        this.route = p_routes
    }

    async start(){

        this.app.use(express.json())
        this.app.use(MainRoutes.getMainRoutes)

        this.app.listen(this.port, ()=>{
            console.log("server running on port", this.port)
        })

    }

}