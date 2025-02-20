import { NextFunction, Request, Response } from "express";
import { JwtAdapter } from "../../configs/jwt";
import { UserModel } from "../../data/mongodb/models/user.model";

export class AuthMiddleware {


    static  validateJwt = async (req: Request, res: Response, next: NextFunction) =>{

        const authorization = req.header('Authorization')
        
        if(!authorization) {
             res.status(401).json({error: "Middleware, No authorization"})            
             return
        }

        if(!authorization!.startsWith("Bearer ")) {
             res.status(401).json({error: "Middleware, No bearer"})
             return
        } 
        
        const token = authorization!.split(' ')[1] || ""



        try {

            const payload = await JwtAdapter.validateToken<{id: string}>(token)

            console.log("payload", payload)
            if(!payload){
                res.status(401).json({error: "Middleware, token invalid"})
                return
            }

            

            const user = await UserModel.findById(payload.id)

            if(!user){
                res.status(401).json({error: "Middleware, invalid token - user not found"})
            }

            req.body.token = token
            
            next();

        } catch (error) {
            console.log(error)
            res.status(500).json({error: "Middleware, Internal server error"})
            
        }
        
    }
}