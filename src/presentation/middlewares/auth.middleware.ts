import { NextFunction, Request, Response } from "express";

export class AuthMiddleware {


    static  validateJwt = (req: Request, res: Response, next: NextFunction): void =>{

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
            //const payload = jwtAdapter


            req.body.token = token
            
            next();

        } catch (error) {
            console.log(error)
            res.status(500).json({error: "internal sever error"})
            
        }
        
    }
}