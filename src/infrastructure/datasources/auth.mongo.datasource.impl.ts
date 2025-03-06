// src/infrastructure/datasources/auth.mongo.datasource.impl.ts
import { BcryptAdapter } from "../../configs/bcrypt";
import { UserModel } from "../../data/mongodb/models/user.model";
import { AuthDatasource } from "../../domain/datasources/auth.datasource";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { UserEntity } from "../../domain/entities/user.entity";
import { CustomError } from "../../domain/errors/custom.error";
import { UserMapper } from "../mappers/user.mapper";

// Tipos para las funciones de hash y compare
type HashFunction = (password: string) => string
type CompareFunction = (password: string, hashed: string) => boolean

export class AuthDatasourceImpl implements AuthDatasource {
    
    constructor(
        private readonly hashPassword: HashFunction = BcryptAdapter.hash,
        private readonly comparePassword: CompareFunction = BcryptAdapter.compare
    ) {}

    async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
        const {email, password} = loginUserDto

        try {
            // Buscar el usuario por email
            const user = await UserModel.findOne({ email: email.toLowerCase() });

            if (!user) {
                throw CustomError.badRequest("User does not exist with this email");
            }

            // Comparar la contraseña
            const isPasswordMatching = this.comparePassword(password, user.password);

            if (!isPasswordMatching) {
                throw CustomError.badRequest("Password is not valid");
            }

            return UserMapper.fromObjectToUserEntity(user);    
        } catch (error) {
            // Propagamos los CustomError directamente
            if (error instanceof CustomError) {
                throw error;
            }
            
            console.log(error);
            throw CustomError.internalServerError("Internal server error during login");
        }
    }

    async register(registerUserDto: RegisterUserDto): Promise<UserEntity> {
        const { name, email, password } = registerUserDto;

        try {
            // Verificar si el correo ya existe
            const exists = await UserModel.findOne({ email: email.toLowerCase() });
            
            if (exists) {
                throw CustomError.badRequest('User already exists with this email');
            }

            // Encriptar la contraseña
            const passwordHashed = this.hashPassword(password);

            // Crear el usuario en la base de datos
            const user = await UserModel.create({
                name: name.toLowerCase(),
                email: email.toLowerCase(),
                password: passwordHashed,
                roles: ['USER_ROLE'] // Asignar rol por defecto
            });

            // Guardar el usuario (esto puede ser redundante con create, pero lo dejamos por si acaso)
            await user.save();

            // Mapear a entidad y retornar
            return UserMapper.fromObjectToUserEntity(user);
        } catch (error) {
            // Si es un error personalizado, lo propagamos directamente
            if (error instanceof CustomError) {
                console.log("mongoAuthDataSourceImpl, entro al throw error comun");
                throw error;
            }

            console.log(error);
            throw CustomError.internalServerError("Internal server error during registration");
        }
    }
}