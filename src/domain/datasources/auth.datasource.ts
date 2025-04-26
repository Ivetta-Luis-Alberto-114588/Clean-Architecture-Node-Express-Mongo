// src/domain/datasources/auth.datasource.ts
import { LoginUserDto } from "../dtos/auth/login-user.dto";
import { RegisterUserDto } from "../dtos/auth/register-user.dto";
import { PaginationDto } from "../dtos/shared/pagination.dto"; // <-- IMPORTAR
import { UserEntity } from "../entities/user.entity";

export abstract class AuthDatasource {

    //login
    abstract login(loginUserDto: LoginUserDto): Promise<UserEntity>

    //register
    abstract register(registerUserDto: RegisterUserDto): Promise<UserEntity>

    abstract findByEmail(email: string): Promise<UserEntity | null>;
    abstract updatePassword(userId: string, newHashedPassword: string): Promise<boolean>;

    // --- NUEVO MÉTODO PAGINADO ---
    /**
     * Obtiene una lista paginada de usuarios.
     * @param paginationDto DTO con page y limit.
     * @returns Promesa con el total de usuarios y la lista de usuarios para la página actual.
     */
    abstract getAllPaginated(paginationDto: PaginationDto): Promise<{ total: number; users: UserEntity[] }>;
    // --- FIN NUEVO MÉTODO ---
}