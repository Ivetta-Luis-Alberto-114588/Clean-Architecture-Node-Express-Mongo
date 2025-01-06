import {Request, Response} from "express"

export class AuthController {

    constructor(){
        
    }


    registerUser =  (req: Request, res: Response)=>{
        res.json("register controller")
    }

    loginrUser =  (req: Request, res: Response)=>{
        res.json("login controller")
    }
}