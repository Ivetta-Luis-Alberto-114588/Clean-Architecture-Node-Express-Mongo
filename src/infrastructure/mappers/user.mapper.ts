import { UserEntity } from "../../domain/entities/user.entity";
import { CustomError } from "../../domain/errors/custom.error";

export class UserMapper {
    //lo que voy a hacer es que va a venir informacion y la voy a transformar
    //en una entidad y de paso voy a hacer validaciones minimas de los datos
    //que me estan llegando
    static fromObjectToUserEntity(object: { [key: string]: any }) {

        const { _id, id, name, email, password, roles } = object

        if (!_id || !id) throw CustomError.badRequest('mapper missing id')
        if (!name) throw CustomError.badRequest("mapper missing name")
        if (!email) throw CustomError.badRequest("mapper missing email")
        // La contraseña puede no venir poblada, hacerla opcional aquí
        if (!password) throw CustomError.badRequest("mapper missing password")
        if (!roles) throw CustomError.badRequest("mapper missing roles")


        return new UserEntity(
            _id?.toString() || id?.toString(),
            name,
            email,
            password || '******', //Usar placeholder si no viene
            roles
        )
    }
}