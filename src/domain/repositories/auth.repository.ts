import { RegisterUserDto } from "../dtos/auth/register-user.dto";
import { UserEntity } from "../entities/user.entity";

abstract class AuthRepository {


    //login

    //register
    abstract register(registerUserDto: RegisterUserDto): Promise<UserEntity>
}