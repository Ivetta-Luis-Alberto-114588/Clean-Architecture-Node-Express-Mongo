import {NextFunction, Request, Response} from "express"
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto"
import { AuthRepository } from "../../domain/repositories/auth.repository"
import { CustomError } from "../../domain/errors/custom.error"

export class AuthController {

    constructor(
        private readonly authRepository: AuthRepository
    ) {
        
    }


    registerUser =  (req: Request, res: Response)=>{
        const[error, registerUserDto] = RegisterUserDto.create(req.body)

        if (error) {
            res.status(400).json({ error });
            return;
          }
        
        this.authRepository.register(registerUserDto!)
            .then(x => res.json(x))
            .catch(x => res.status(500).json(x))

    }

    loginUser =  (req: Request, res: Response)=>{
        res.json("login controller")
    }
}