import { Validators } from "../../../configs/validator"


export class LoginUserDto {
    
    constructor(
        public email: string,
        public password: string
    ){}


    //este metodo va a devolver una instancia de la clase actual o un array con los errores
    static login(object: {[key: string]: any}): [string?, LoginUserDto?]{

        const {email, password} = object

        if(!email) return ["email is required"]
        if(!Validators.checkEmail.test(email)) return ["email has not a valid format"]
        if(!password) return ["password is required"]


        return [undefined, new LoginUserDto(email, password)]
    }

}