import {NextFunction, Request, Response} from "express"
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto"
import { AuthRepository } from "../../domain/repositories/auth.repository"
import { CustomError } from "../../domain/errors/custom.error"
import { JwtAdapter } from "../../configs/jwt"
import { UserModel } from "../../data/mongodb/models/user.model"
import { RegisterUser } from "../../domain/use-cases/auth/register-user.use-case"
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto"
import { LoginUser } from "../../domain/use-cases/auth/login-user.use-case"

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
        
        new RegisterUser(this.authRepository)
            .execute(registerUserDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res))       

    }

    loginUser =  (req: Request, res: Response)=>{
        const [error, loginUserDto] = LoginUserDto.login(req.body);
    
        if (error) {
             res.status(400).json({ error });
        }
        
        new LoginUser(this.authRepository)
            .execute(loginUserDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res))     
    }

    getUsers = (req: Request, res: Response)=>{
        UserModel.find()
            .then(users => {
                
                return res.json({
                    //users,
                    user: req.body.user
                })
            })
            .catch(x=> res.status(500).send({error: "internal server error"}))
    }

    //TODO delete, update, etc
}