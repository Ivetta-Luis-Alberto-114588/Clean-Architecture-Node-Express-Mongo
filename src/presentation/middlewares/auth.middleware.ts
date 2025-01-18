import { NextFunction, Request, Response } from "express";
import { JwtAdapter } from "../../configs/jwt";

export class AuthMiddleware {


    static  validateJwt = async (req: Request, res: Response, next: NextFunction) =>{

        const authorization = req.header('Authorization')
        
        if(!authorization) {
             res.status(401).json({error: "no token"})            
             return
        }

        if(!authorization!.startsWith("Bearer ")) {
             res.status(401).json({error: "no bearer"})
             return
        } 
        
        const token = authorization!.split(' ')[1] || ""

        try {

            //todo
            const payload = await JwtAdapter.validateToken<{id: string}>(token)

            if(!payload){
                res.status(401).json({error: "no payload"})
                return
            }

            req.body.payload = payload
            
            next();

        } catch (error) {
            console.log(error)
            res.status(500).json({error: "internal sever error"})
            
        }
        
    }
}