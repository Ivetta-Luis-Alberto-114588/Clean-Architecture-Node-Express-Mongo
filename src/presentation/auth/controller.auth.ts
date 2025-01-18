import {NextFunction, Request, Response} from "express"
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto"
import { AuthRepository } from "../../domain/repositories/auth.repository"
import { CustomError } from "../../domain/errors/custom.error"

export class AuthController {

    constructor(
        private readonly authRepository: AuthRepository
    ) {}

    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError){
            return res.status(error.statusCode).json({error: error.message});
        }
    
        console.log(error);
        return res.status(500).json({error: "internal server error"});
    }


    registerUser = (req: Request, res: Response) => {
        const [error, registerUserDto] = RegisterUserDto.create(req.body);
    
        if (error) {
            return res.status(400).json({ error });
        }
        
        this.authRepository.register(registerUserDto!)
            .then(user => res.json(user))
            .catch(error => this.handleError(error, res));
    }

    loginUser =  (req: Request, res: Response)=>{
        res.json("login controller")
    }
}