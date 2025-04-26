// src/infrastructure/datasources/auth.mongo.datasource.impl.ts
import { BcryptAdapter } from "../../configs/bcrypt";
import { UserModel } from "../../data/mongodb/models/user.model";
import { AuthDatasource } from "../../domain/datasources/auth.datasource";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto"; // <-- IMPORTAR
import { UserEntity } from "../../domain/entities/user.entity";
import { CustomError } from "../../domain/errors/custom.error";
import { UserMapper } from "../mappers/user.mapper";
import logger from "../../configs/logger";

type HashFunction = (password: string) => string
type CompareFunction = (password: string, hashed: string) => boolean

export class AuthDatasourceImpl implements AuthDatasource {

    constructor(
        private readonly hashPassword: HashFunction = BcryptAdapter.hash,
        private readonly comparePassword: CompareFunction = BcryptAdapter.compare
    ) { }

    // ... (métodos login, register, findByEmail, updatePassword sin cambios) ...
    async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
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

    async findByEmail(email: string): Promise<UserEntity | null> {
        try {
            const user = await UserModel.findOne({ email: email.toLowerCase() });
            if (!user) return null;
            return UserMapper.fromObjectToUserEntity(user);
        } catch (error) {
            logger.error(`Error buscando usuario por email ${email}`, { error });
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
                return false;
            }
            if (result.modifiedCount === 0) {
                logger.warn(`Contraseña no modificada para usuario ${userId} (posiblemente era la misma)`);
            }

            logger.info(`Contraseña actualizada para usuario ${userId}`);
            return true;
        } catch (error) {
            logger.error(`Error actualizando contraseña para usuario ${userId}`, { error });
            throw CustomError.internalServerError("Error al actualizar la contraseña.");
        }
    }


    // --- IMPLEMENTACIÓN NUEVO MÉTODO PAGINADO ---
    async getAllPaginated(paginationDto: PaginationDto): Promise<{ total: number; users: UserEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;

        try {
            // Ejecutar conteo y búsqueda en paralelo
            const [total, usersData] = await Promise.all([
                UserModel.countDocuments(), // Contar todos los usuarios
                UserModel.find() // Encontrar usuarios para la página actual
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }) // Opcional: ordenar por fecha de creación
                    .lean() // Usar lean() para obtener objetos JS planos (mejor rendimiento)
            ]);

            // Mapear los resultados a UserEntity
            // ¡Importante! lean() devuelve objetos planos, el mapper debe poder manejarlos
            const users = usersData.map(userDoc => UserMapper.fromObjectToUserEntity(userDoc));

            return {
                total,
                users
            };
        } catch (error) {
            logger.error('Error obteniendo usuarios paginados en AuthDatasourceImpl', { error });
            throw CustomError.internalServerError("Error al obtener usuarios paginados.");
        }
    }
    // --- FIN IMPLEMENTACIÓN ---
}