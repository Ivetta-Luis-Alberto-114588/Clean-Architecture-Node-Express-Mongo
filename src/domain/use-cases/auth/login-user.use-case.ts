import { JwtAdapter } from "../../../configs/jwt";
import { LoginUserDto } from "../../dtos/auth/login-user.dto";
import { RegisterUserDto } from "../../dtos/auth/register-user.dto";
import { CustomError } from "../../errors/custom.error";
import { AuthRepository } from "../../repositories/auth.repository";


//defino la firma de los metodos de los casos de uso
interface ILoginUserUseCase {
    execute(registerUserDto: RegisterUserDto): Promise<IUserWithToken>
}

//defino la firma de lo que va a devolver el caso de uso
interface IUserWithToken {
    user: {
        id: string,
        name: string,
        email: string,
        password: string,
        roles: string[]
        token: string,
    }
}

//es como una interfaz pero para una funcion del token
type SignToken = (payload: Object, duration?: "2h") => Promise<string | null>


export class LoginUserUseCase implements ILoginUserUseCase {

    //aca tengo que inyectar el AuthRepository para poder usarlo en el controller
    //ya que el controller no tiene que saber como se implementa el repositorio
    constructor(
        private readonly authRepository: AuthRepository,

        //aca inyecto el metodo de generar el token y pongo un valor por defecto
        //para que si no la envian tome el valor por defecto
        private readonly signToken: SignToken = JwtAdapter.generateToken
    ) { }



    async execute(loginUserDto: LoginUserDto): Promise<IUserWithToken> {

        try {
            //crear usuario
            const user = await this.authRepository.login(loginUserDto)
            //token
            const token = await this.signToken({ id: user.id }, '2h')

            if (!token) throw CustomError.internalServerError("Login-use-case, Error generating token")

            return {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                    roles: user.roles,
                    token: token,
                },
            }


        } catch (error) {

            // Propagamos el error para que lo maneje el controlador
            if (error instanceof CustomError) {
                throw error;
            }
            throw CustomError.internalServerError("Login-use-case, internal server error");
        }


    }

}
