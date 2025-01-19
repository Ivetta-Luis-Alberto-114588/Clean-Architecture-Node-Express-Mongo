import { BcryptAdapter } from "../../configs/bcrypt";
import { UserModel } from "../../data/mongodb/models/user.model";
import { AuthDatasource } from "../../domain/datasources/auth.datasource";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../domain/dtos/auth/register-user.dto";
import { UserEntity } from "../../domain/entities/user.entity";
import { CustomError } from "../../domain/errors/custom.error";
import { UserMapper } from "../mappers/user.mapper";


//estoy creando como unas interfaces para tipar 
type HashFunction = (password: string) => string
type CompareFunction = (password: string, hashed: string) => boolean


export class AuthDatasourceImpl implements AuthDatasource{
    
    constructor(
        private readonly hashPassword: HashFunction = BcryptAdapter.hash,
        private readonly comparePassword: CompareFunction = BcryptAdapter.compare
    ){}

    async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
        const {email, password} = loginUserDto


        try {

            const user = await UserModel.findOne({email: email})

            if(!user) throw CustomError.badRequest("user does not exists - email")

            const isPasswordMatching = this.comparePassword(password, user.password)

            if(!isPasswordMatching) throw CustomError.badRequest("password is not valid")

            return UserMapper.userEntityFromObject(user)    
            
        } catch (error) {
            console.log(error)
            throw CustomError.internalServerError()
        }


    }


    async register(registerUserDto: RegisterUserDto): Promise<UserEntity> {
    
        const {name, email, password} = registerUserDto

        try {

            //1 verificar correo
            const exists = await UserModel.findOne({email: email})
            if(exists) throw CustomError.badRequest('user already exists')

            //2 encritar la contraseña
            const passwordHashed = this.hashPassword(password)


            //creo el usuario con el modelo
            const user = await UserModel.create({
                name: name,
                email: email,
                password: passwordHashed
            })

            //guardo el user en la bd
            await user.save()


            //3 mapear la respuesa nuestra entidad
            return UserMapper.userEntityFromObject(user)
            
        } catch (error) {
            
            if(error instanceof CustomError){
                throw error
            }

            throw CustomError.internalServerError()
        }
    
    }

}