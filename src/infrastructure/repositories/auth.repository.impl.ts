// src/infrastructure/repositories/auth.repository.impl.ts
import { AuthDatasource } from "../../domain/datasources/auth.datasource";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { UserEntity } from "../../domain/entities/user.entity";
import { AuthRepository } from "../../domain/repositories/auth.repository";


export class AuthRepositoryImpl implements AuthRepository {

    constructor(
        private readonly authDatasource: AuthDatasource
    ) { }

    login(loginUserDto: LoginUserDto): Promise<UserEntity> {
        return this.authDatasource.login(loginUserDto)
    }

    register(registerUserDto: RegisterUserDto): Promise<UserEntity> {
        return this.authDatasource.register(registerUserDto)
    }

    // <<<--- IMPLEMENTACIÓN NUEVOS MÉTODOS --- >>>
    findByEmail(email: string): Promise<UserEntity | null> {
        return this.authDatasource.findByEmail(email);
    }

    updatePassword(userId: string, newHashedPassword: string): Promise<boolean> {
        return this.authDatasource.updatePassword(userId, newHashedPassword);
    }
    // <<<--- FIN IMPLEMENTACIÓN --- >>>
}