// src/presentation/auth/controller.auth.ts
import { Request, Response } from "express"; // Asegurar importación
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { AuthRepository } from "../../domain/repositories/auth.repository";
import { CustomError } from "../../domain/errors/custom.error";
import { RegisterUserUseCase } from "../../domain/use-cases/auth/register-user.use-case";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { LoginUserUseCase } from "../../domain/use-cases/auth/login-user.use-case";
import { CustomerRepository } from "../../domain/repositories/customers/customer.repository";
import { ForgotPasswordDto } from "../../domain/dtos/auth/forgot-password.dto"; // <<<--- IMPORTAR
import { ResetPasswordDto } from "../../domain/dtos/auth/reset-password.dto"; // <<<--- IMPORTAR
import { RequestPasswordResetUseCase } from "../../domain/use-cases/auth/request-password-reset.use-case"; // <<<--- IMPORTAR
import { ResetPasswordUseCase } from "../../domain/use-cases/auth/reset-password.use-case"; // <<<--- IMPORTAR
import { EmailService } from "../../domain/interfaces/email.service"; // <<<--- IMPORTAR
import { UserModel } from "../../data/mongodb/models/user.model"; // <<<--- IMPORTAR (si se usa en otros métodos)
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";

export class AuthController {

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly customerRepository: CustomerRepository,
        private readonly emailService: EmailService // <<<--- INYECTAR EmailService
    ) { }

    private handleError = (error: unknown, res: Response) => {
        // ... (handleError existente) ...
        if (error instanceof CustomError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.log("Error en AuthController:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }

    registerUser = async (req: Request, res: Response) => {
        // ... (registerUser existente) ...
        try {
            const [error, registerUserDto] = RegisterUserDto.create(req.body);
            if (error) {
                console.log("error en controller.auth.registerUser", error);
                return res.status(400).json({ error });
            } const result = await new RegisterUserUseCase(
                this.authRepository,
                this.customerRepository
            ).execute(registerUserDto!);
            return res.status(201).json(result);
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    loginUser = async (req: Request, res: Response) => {
        // ... (loginUser existente) ...
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

    // <<<--- NUEVO MÉTODO: Solicitar Reseteo --- >>>
    requestPasswordReset = (req: Request, res: Response) => {
        const [error, forgotPasswordDto] = ForgotPasswordDto.create(req.body);
        if (error) return res.status(400).json({ error });

        new RequestPasswordResetUseCase(this.authRepository, this.emailService)
            .execute(forgotPasswordDto!)
            .then(result => res.json(result)) // Devuelve el mensaje genérico
            .catch(err => this.handleError(err, res));
    }

    // <<<--- NUEVO MÉTODO: Resetear Contraseña --- >>>
    resetPassword = (req: Request, res: Response) => {
        const [error, resetPasswordDto] = ResetPasswordDto.create(req.body);
        if (error) return res.status(400).json({ error });

        new ResetPasswordUseCase(this.authRepository)
            .execute(resetPasswordDto!)
            .then(result => res.json(result)) // Devuelve mensaje de éxito
            .catch(err => this.handleError(err, res));
    }

    // ... (resto de métodos existentes: getUserByToken, getAllUsers, etc.) ...
    getUserByToken = (req: Request, res: Response) => {
        return res.json({
            user: req.body.user
        });
    }
    getAllUsers = async (req: Request, res: Response) => {
        const { page = 1, limit = 10 } = req.query; // Obtener page y limit de la query

        // Validar paginación
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) return res.status(400).json({ error });

        try {
            // Llamar al método paginado del repositorio
            const { total, users } = await this.authRepository.getAllPaginated(paginationDto!);

            // --- IMPORTANTE: Omitir contraseñas antes de enviar ---
            const usersToSend = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            // --- FIN OMITIR CONTRASEÑAS ---

            // Devolver la estructura paginada
            return res.json({
                total,
                users: usersToSend // Enviar usuarios sin contraseña
            });

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

    getUserByIdAdmin = async (req: Request, res: Response) => {
        const { id } = req.params;

        // Validar que el ID sea un ObjectId válido de MongoDB
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'ID de usuario inválido.' });
        }

        try {
            // Llama a un método del repositorio para buscar por ID
            // Asume que tienes findById en tu AuthRepository/AuthDatasource
            const user = await this.authRepository.findById(id); // <-- NECESITAS IMPLEMENTAR findById

            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }

            // Omitir contraseña antes de enviar
            const { password, ...userWithoutPassword } = user;
            return res.json(userWithoutPassword);

        } catch (err) {
            // Usa tu manejador de errores
            return this.handleError(err, res);
        }
    }
}