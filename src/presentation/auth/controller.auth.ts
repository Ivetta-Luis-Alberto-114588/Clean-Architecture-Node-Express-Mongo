// src/presentation/auth/controller.auth.ts
import { NextFunction, Request, Response } from "express";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { AuthRepository } from "../../domain/repositories/auth.repository";
import { CustomError } from "../../domain/errors/custom.error";
import { JwtAdapter } from "../../configs/jwt";
import { UserModel } from "../../data/mongodb/models/user.model";
import { RegisterUserUseCase } from "../../domain/use-cases/auth/register-user.use-case";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { LoginUserUseCase } from "../../domain/use-cases/auth/login-user.use-case";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository"; // <<<--- IMPORTAR

export class AuthController {

    // <<<--- Añadir CustomerRepository al constructor --- >>>
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly customerRepository: CustomerRepository // <<<--- AÑADIR
    ) { }

    private handleError = (error: unknown, res: Response) => {
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.log("Error en AuthController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    registerUser = async (req: Request, res: Response) => {
        try {
            const [error, registerUserDto] = RegisterUserDto.create(req.body);
            if (error) {
                console.log("error en controller.auth.registerUser", error);
                return res.status(400).json({ error });
            }

            // <<<--- Pasar customerRepository al UseCase --- >>>
            const result = await new RegisterUserUseCase(
                this.authRepository,
                this.customerRepository // <<<--- PASAR AQUÍ
            ).execute(registerUserDto!);

            return res.json(result);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    // ... (resto de métodos: loginUser, getUserByToken, etc. sin cambios) ...
    loginUser = async (req: Request, res: Response) => {
        try {
            const [error, loginUserDto] = LoginUserDto.login(req.body);

            if (error) {
                console.log("error en controller.auth.loginUser", error);
                return res.status(400).json({ error });
            }

            const result = await new LoginUserUseCase(this.authRepository)
                .execute(loginUserDto!);

            return res.json(result);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    getUserByToken = (req: Request, res: Response) => {
        return res.json({
            user: req.body.user
        });
    }

    getAllUsers = async (req: Request, res: Response) => {
        try {
            const users = await UserModel.find();
            return res.json({ users });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

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