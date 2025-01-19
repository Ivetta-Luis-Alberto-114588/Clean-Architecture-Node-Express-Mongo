import { JwtAdapter } from "../../../configs/jwt";
import { LoginUserDto } from "../../dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../dtos/auth/register-user.dto";
import { CustomError } from "../../errors/custom.error";
import { AuthRepository } from "../../repositories/auth.repository";

interface LoginUserUseCase{
    execute (registerUserDto: RegisterUserDto): Promise<UserToken>
}

interface UserToken{
    token: string,
    user: {
        id: string, 
        name: string,
        email: string
    }
}

//es como una interfaz pero para una funcion
type SignToken = (payload: Object, duration?: "2h") => Promise<string | null>
            

export class LoginUser implements LoginUserUseCase {
    
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly signToken: SignToken = JwtAdapter.generateToken
    ){}
    
    async execute(loginUserDto: LoginUserDto): Promise<UserToken> {
        
        //crear usuario
        const user = await this.authRepository.login(loginUserDto)
        

        //token
        const token = await this.signToken({id: user.id}, '2h')

        if(!token) throw CustomError.internalServerError("error generating token")



        return {
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,

            }
        }
    }

}
