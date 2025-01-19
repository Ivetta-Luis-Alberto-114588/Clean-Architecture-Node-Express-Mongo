import { LoginUserDto } from "../dtos/auth/login-user.dto";
import { RegisterUserDto } from "../dtos/auth/register-user.dto";
import { UserEntity } from "../entities/user.entity";

export abstract class AuthRepository {


    //login
    abstract login(loginUserDto: LoginUserDto): Promise<UserEntity>

    //register
    abstract register(registerUserDto: RegisterUserDto): Promise<UserEntity>
}