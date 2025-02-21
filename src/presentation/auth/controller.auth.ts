import {NextFunction, Request, Response} from "express"
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto"
import { AuthRepository } from "../../domain/repositories/auth.repository"
import { CustomError } from "../../domain/errors/custom.error"
import { JwtAdapter } from "../../configs/jwt"
import { UserModel } from "../../data/mongodb/models/user.model"
import { RegisterUserUseCase } from "../../domain/use-cases/auth/register-user.use-case"
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto"
import { LoginUserUseCase } from "../../domain/use-cases/auth/login-user.use-case"

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
             console.log("error en controller.auth.registerUser", error)
             
             //si hay un error de validacion tengo que cortar la ejecucion
             return
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
        // aca mando a llamar el caso de uso para registrar un usuario
        new RegisterUserUseCase(this.authRepository)
            .execute(registerUserDto!)
            .then(data => res.json(data))  //aca puede haber error de binding
            .catch(err => this.handleError(err, res))          


    }
    

    //aca se van a llamar los casos de uso
    loginUser =  (req: Request, res: Response)=>{
        const [error, loginUserDto] = LoginUserDto.login(req.body);
    
        if (error) {
             res.status(400).json({ error });
             console.log("error en controller.auth.loginUser", error)

             //si hay un error de validacion tengo que cortar la ejecucion
            return
        }
        

        //aca mando a llamar al caso de uso para loguear un usuario
        new LoginUserUseCase(this.authRepository)
            .execute(loginUserDto!)
            .then(data => res.json(data)) //aca puede haber error de binding
            .catch(err => this.handleError(err, res))     
    }


    //aca se van a llamar los casos de uso
    getUserByToken = (req: Request, res: Response)=>{
        UserModel.find()
            .then(users => res.json({
                user: req.body.user
                })
            )
            .catch(x=> res.status(500).send({error: "controller.auth getUserInternal server error"}))
    }

    //aca se van a llamar los casos de uso
    getAllUsers = (req: Request, res: Response)=>{
        UserModel.find()
            .then(users => res.json({
                users: users
                })
            )
            .catch(x=> res.status(500).send({error: "controller.auth getUserInternal server error"}))
    }

    deleteUser = (req: Request, res: Response)=>{
        const id = req.params.id
        UserModel.deleteOne({_id: id})
            .exec()
            .then(x=> res.json({message: "user deleted"}))
            .catch(x=> res.status(500).send({error: "controller.auth deleteUserInternal server error"}))
    }

    updateUser = (req: Request, res: Response)=>{
        const id = req.params.id
        const userToModify = req.body
        UserModel
            .updateOne({_id: id}, userToModify)
            .exec()
            .then(x=> res.json({message: "user updated"}))
            .catch(x=> res.status(500).send({error: "controller.auth updateUserInternal server error"}))
    }

}