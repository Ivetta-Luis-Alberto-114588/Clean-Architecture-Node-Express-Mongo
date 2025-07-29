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
                throw CustomError.unauthorized("User does not exist with this email");
            }
            const isPasswordMatching = this.comparePassword(password, user.password);
            if (!isPasswordMatching) {
                throw CustomError.unauthorized("Password is not valid");
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


    async getAllPaginated(paginationDto: PaginationDto): Promise<{ total: number; users: UserEntity[] }> {
        const { page, limit } = paginationDto;
        const skip = (page - 1) * limit;
        logger.debug(`getAllPaginated - Page: ${page}, Limit: ${limit}, Skip: ${skip}`); // Log de entrada

        try {
            const countPromise = UserModel.countDocuments();
            const findPromise = UserModel.find()
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }) // Verifica que timestamps:true esté en user.model.ts
                // .lean() // <--- PRUEBA COMENTANDO ESTO PRIMERO
                .exec(); // Usa exec() para asegurar que devuelve una Promesa

            // Ejecutar conteo y búsqueda en paralelo
            const [total, usersData] = await Promise.all([countPromise, findPromise]);

            logger.debug(`getAllPaginated - Total encontrado: ${total}`);
            logger.debug(`getAllPaginated - Datos crudos encontrados: ${usersData?.length} usuarios`);
            // Loguea los datos crudos SÓLO para depurar, pueden contener passwords hasheadas
            // logger.debug('getAllPaginated - Datos crudos:', JSON.stringify(usersData, null, 2));

            // Mapear los resultados a UserEntity
            const users = usersData.map(userDoc => {
                try {
                    return UserMapper.fromObjectToUserEntity(userDoc);
                } catch (mapperError: any) {
                    // Loguear el error específico del mapper y el documento que falló
                    logger.error(`Error mapeando User doc: ${userDoc?._id || 'ID Desconocido'}`, { error: mapperError.message, stack: mapperError.stack, userDoc });
                    // Puedes decidir lanzar el error o devolver un UserEntity placeholder/null
                    throw new Error(`Error mapeando usuario: ${mapperError.message}`); // Relanzar para que caiga en el catch principal
                }
            });

            logger.debug(`getAllPaginated - Mapeo completado para ${users.length} usuarios.`);

            return {
                total,
                users
            };
        } catch (error: any) { // Captura el error específico
            // Loguear el error DETALLADO antes de lanzar el genérico
            logger.error('Error DETALLADO obteniendo usuarios paginados en AuthDatasourceImpl', {
                errorMessage: error.message,
                stack: error.stack,
                errorObject: error // Loguea el objeto de error completo si es posible
            });
            // Lanza el error genérico para la respuesta API
            throw CustomError.internalServerError("Error al obtener usuarios paginados.");
        }
    }

    async findById(id: string): Promise<UserEntity | null> {
        try {
            //Validar que el ID sea un ObjectId válido de MongoDB
            if (!id.match(/^[0-9a-fA-F]{24}$/)) return

            const user = await UserModel.findById(id);
            if (!user) return null;
            return UserMapper.fromObjectToUserEntity(user);
        } catch (error) {
            logger.error(`Error buscando usuario por ID ${id}`, { error });
            // Devuelve null o lanza un error interno según prefieras
            return null; // Devolver null suele ser más seguro que lanzar 500 aquí
        }
    }
}