import {NextFunction, Request, Response} from "express"
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto"
import { AuthRepository } from "../../domain/repositories/auth.repository"
import { CustomError } from "../../domain/errors/custom.error"
import { JwtAdapter } from "../../configs/jwt"

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


    registerUser = (req: Request, res: Response): void => {
        const [error, registerUserDto] = RegisterUserDto.create(req.body);
    
        if (error) {
             res.status(400).json({ error });
        }
        
        this.authRepository.register(registerUserDto!)
            .then(async(user) => {
                
                
                res.json({
                    user: user,
                    token: await JwtAdapter.generateToken({id: user.id}, '2h')
                })
            })
            .catch(error => this.handleError(error, res));
    }

    loginUser =  (req: Request, res: Response)=>{
        res.json("login controller")
    }
}