import { AuthDatasource } from "../../domain/datasources/auth.datasource";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { UserEntity } from "../../domain/entities/user.entity";
import { CustomError } from "../../domain/errors/custom.error";

export class AuthDatasourceImpl implements AuthDatasource{
    
    async register(registerUserDto: RegisterUserDto): Promise<UserEntity> {
    
        const {name, email, password} = registerUserDto

        try {

            //1 veriricar correo
            //2 hash de la contraseña
            //3 mapear la respuesa nuestra entidad
            //4 guardar en la bd
            return new UserEntity(
                "1",
                "name",
                "password",
                ["ADMIN_ROLE"],
            )
            
        } catch (error) {
            
            if(error instanceof CustomError){
                throw error
            }

            throw CustomError.internalServerError()
        }
    
    }

}