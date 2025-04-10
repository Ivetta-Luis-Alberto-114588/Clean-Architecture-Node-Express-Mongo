// src/infrastructure/datasources/auth.mongo.datasource.impl.ts
import { BcryptAdapter } from "../../configs/bcrypt";
import { UserModel } from "../../data/mongodb/models/user.model";
import { AuthDatasource } from "../../domain/datasources/auth.datasource";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { UserEntity } from "../../domain/entities/user.entity";
import { CustomError } from "../../domain/errors/custom.error";
import { UserMapper } from "../mappers/user.mapper";
import logger from "../../configs/logger"; // Importar logger

type HashFunction = (password: string) => string
type CompareFunction = (password: string, hashed: string) => boolean

export class AuthDatasourceImpl implements AuthDatasource {

    constructor(
        private readonly hashPassword: HashFunction = BcryptAdapter.hash,
        private readonly comparePassword: CompareFunction = BcryptAdapter.compare
    ) { }

    async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
        // ... (código existente sin cambios) ...
        const { email, password } = loginUserDto
        try {
            const user = await UserModel.findOne({ email: email.toLowerCase() });
            if (!user) {
                throw CustomError.badRequest("User does not exist with this email");
            }
            const isPasswordMatching = this.comparePassword(password, user.password);
            if (!isPasswordMatching) {
                throw CustomError.badRequest("Password is not valid");
            }
            return UserMapper.fromObjectToUserEntity(user);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            logger.error("Error en login AuthDatasourceImpl", { error });
            throw CustomError.internalServerError("Internal server error during login");
        }
    }

    async register(registerUserDto: RegisterUserDto): Promise<UserEntity> {
        // ... (código existente sin cambios) ...
        const { name, email, password } = registerUserDto;
        try {
            const exists = await UserModel.findOne({ email: email.toLowerCase() });
            if (exists) {
                throw CustomError.badRequest('User already exists with this email');
            }
            const passwordHashed = this.hashPassword(password);
            const user = await UserModel.create({
                name: name.toLowerCase(),
                email: email.toLowerCase(),
                password: passwordHashed,
                roles: ['USER_ROLE']
            });
            await user.save(); // create ya guarda, pero save() no hace daño
            return UserMapper.fromObjectToUserEntity(user);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            logger.error("Error en register AuthDatasourceImpl", { error });
            throw CustomError.internalServerError("Internal server error during registration");
        }
    }

    // <<<--- IMPLEMENTACIÓN NUEVOS MÉTODOS --- >>>
    async findByEmail(email: string): Promise<UserEntity | null> {
        try {
            const user = await UserModel.findOne({ email: email.toLowerCase() });
            if (!user) return null;
            return UserMapper.fromObjectToUserEntity(user);
        } catch (error) {
            logger.error(`Error buscando usuario por email ${email}`, { error });
            // No lanzar error aquí, devolver null para que el UseCase decida
            return null;
        }
    }

    async updatePassword(userId: string, newHashedPassword: string): Promise<boolean> {
        try {
            const result = await UserModel.updateOne(
                { _id: userId },
                { $set: { password: newHashedPassword } }
            );

            if (result.matchedCount === 0) {
                logger.warn(`Intento de actualizar contraseña para usuario no encontrado: ${userId}`);
                return false; // Usuario no encontrado
            }
            if (result.modifiedCount === 0) {
                logger.warn(`Contraseña no modificada para usuario ${userId} (posiblemente era la misma)`);
                // Considerar esto como éxito o no dependiendo del caso. True es razonable.
            }

            logger.info(`Contraseña actualizada para usuario ${userId}`);
            return true; // Actualización exitosa (o no necesaria)
        } catch (error) {
            logger.error(`Error actualizando contraseña para usuario ${userId}`, { error });
            throw CustomError.internalServerError("Error al actualizar la contraseña.");
        }
    }
    // <<<--- FIN IMPLEMENTACIÓN --- >>>
}