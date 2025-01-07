import { RegisterUserDto } from "../dtos/auth/register-user.dto";
import { UserEntity } from "../entities/user.entity";

abstract class AuthDatasource {


    //login

    //register
    abstract register(registerUserDto: RegisterUserDto): Promise<UserEntity>
}