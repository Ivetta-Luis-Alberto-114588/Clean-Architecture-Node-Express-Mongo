import express from "express"
import { AppRoutes } from "./routes"


export class server {

    public readonly app = express()
    private readonly port : number

    constructor(p_port: number){
        this.port = p_port
    }

    async start(){

        this.app.use(express.json())
        this.app.use(AppRoutes.routes)

        this.app.listen(this.port, ()=>{
            console.log("server running on port", this.port)
        })

    }

}