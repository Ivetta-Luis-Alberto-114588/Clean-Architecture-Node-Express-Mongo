// src/domain/datasources/auth.datasource.ts
import { LoginUserDto } from "../dtos/auth/login-user.dto";
import { RegisterUserDto } from "../dtos/auth/register-user.dto";
import { UserEntity } from "../entities/user.entity";

export abstract class AuthDatasource {

    //login
    abstract login(loginUserDto: LoginUserDto): Promise<UserEntity>

    //register
    abstract register(registerUserDto: RegisterUserDto): Promise<UserEntity>

    // <<<--- NUEVOS MÉTODOS --- >>>
    abstract findByEmail(email: string): Promise<UserEntity | null>;
    abstract updatePassword(userId: string, newHashedPassword: string): Promise<boolean>; // Devuelve true si se actualizó
    // <<<--- FIN NUEVOS MÉTODOS --- >>>
}