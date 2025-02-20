//  uso del patron factory
//  no se puede instanciar la clase, solo con el metodo create
//  este metodo tiene verificaciones antes de la creacion
// con las validaciones no uso librerias externas

import { Validators } from "../../../configs/validator"

export class RegisterUserDto {
    

    //el constructor es privado para que solo se puedan crear instancias
    //dentro de esta clase solamente
    private constructor(
        public name: string,
        public email: string,
        public password: string
    ){}

    static create(object: {[key:string]:any}): [string?, RegisterUserDto?]{
                // object("name": string)       [error, instancia del dto]
        
        
        // desestructo el objeto que estoy esperando
        const {name, email, password} = object
        

        //aca estan las validaciones necesarias y siempre debo devolver una tupla, 2 valores
        if(!name) return ["name is required", undefined]
        if(!email) return ["email is required", undefined]
        
        //validators.checkEmail va a devolver una expresion regular
        if(!Validators.checkEmail.test(email)) return ["email is not valid", undefined]
        if(!password) return ["password is required", undefined]
        if( password.length < 6 )  return ["password too short", undefined]
        

        //como no hay error devuelvo undefined y la instancia del dto (que es privada)
        return [undefined, new RegisterUserDto(name.toLowerCase(), email.toLowerCase(), password)]
    }

}