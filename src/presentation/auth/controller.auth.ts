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

    // metodo para manejar errores dentro de esta clase
    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError){
            return res.status(error.statusCode).json({error: error.message});
        }
    
        console.log("metodo handleError del controller ", error);
        return res.status(500).json({error: "Internal server error"});
    }

    //aca se van a llamar los casos de uso
    registerUser = (req: Request, res: Response): void => {
        const [error, registerUserDto] = RegisterUserDto.create(req.body);
    
        //si existe un error en el Dto lo capturo y envio como respuesta en el controller
        if (error) {
             res.status(400).json({ error });
        }
 
        // 1) primer
        //esto maneja bien los errores y anda ok
        // res.json(registerUserDto)


        // 2) segundo si manejar errores en el repository
        //pasa directamente el error sin personalizarlos
        // this.authRepository
        //     .register(registerUserDto!)
        //     .then(user => res.json(user))
        //     .catch(error => res.status(500).json(error)) 



        // 3) tercero
        // como en este punto no hay error en el dto sigo normalmente
        new RegisterUser(this.authRepository)
            .execute(registerUserDto!)
            .then(data => res.json(data))
            .catch(err => this.handleError(err, res))          


    }
    

    //aca se van a llamar los casos de uso
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

    //aca se van a llamar los casos de uso
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