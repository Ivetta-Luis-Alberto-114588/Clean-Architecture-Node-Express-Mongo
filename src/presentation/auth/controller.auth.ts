// src/presentation/auth/controller.auth.ts
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

    // Método para manejar errores
    private handleError = (error: unknown, res: Response) => {
        if(error instanceof CustomError){
            return res.status(error.statusCode).json({error: error.message});
        }
    
        console.log("Error en AuthController:", error);
        return res.status(500).json({error: "Error interno del servidor"});
    }

    // Método asincrónico para registrar usuarios
    registerUser = async (req: Request, res: Response) => {
        try {
            const [error, registerUserDto] = RegisterUserDto.create(req.body);
        
            // Si hay un error de validación, lo respondemos
            if (error) {
                console.log("error en controller.auth.registerUser", error);
                return res.status(400).json({ error });
            }
     
            // Crear el caso de uso y ejecutarlo
            const result = await new RegisterUserUseCase(this.authRepository)
                .execute(registerUserDto!);
            
            // Responder con el resultado
            return res.json(result);
        } catch (err) {
            return this.handleError(err, res);
        }
    }
    
    // Método asincrónico para login
    loginUser = async (req: Request, res: Response) => {
        try {
            const [error, loginUserDto] = LoginUserDto.login(req.body);
        
            // Si hay un error de validación, lo respondemos
            if (error) {
                console.log("error en controller.auth.loginUser", error);
                return res.status(400).json({ error });
            }
            
            // Crear el caso de uso y ejecutarlo
            const result = await new LoginUserUseCase(this.authRepository)
                .execute(loginUserDto!);
                
            // Responder con el resultado
            return res.json(result);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // Método para obtener usuario por token
    getUserByToken = (req: Request, res: Response) => {
        return res.json({
            user: req.body.user
        });
    }

    // Método para obtener todos los usuarios
    getAllUsers = async (req: Request, res: Response) => {
        try {
            const users = await UserModel.find();
            return res.json({ users });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // Método para eliminar un usuario
    deleteUser = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const result = await UserModel.deleteOne({ _id: id });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            
            return res.json({ message: "Usuario eliminado" });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // Método para actualizar un usuario
    updateUser = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const userToModify = req.body;
            
            const updatedUser = await UserModel.findByIdAndUpdate(
                id, 
                userToModify, 
                { new: true }
            );
            
            if (!updatedUser) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            
            return res.json({ message: "Usuario actualizado", user: updatedUser });
        } catch (err) {
            return this.handleError(err, res);
        }
    }
}