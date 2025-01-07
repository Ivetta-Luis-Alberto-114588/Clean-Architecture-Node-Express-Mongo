//  uso del patron factory
//  no se puede instanciar la clase, solo con el metodo create
//  este metodo tiene verificaciones antes de la creacion
// con las validaciones no uso librerias externas

import { Validators } from "../../../configs/validator"

export class RegisterUserDto {
    
    private constructor(
        public name: string,
        public email: string,
        public password: string
    ){}

    static create(object: {[key:string]:any}): [string?, RegisterUserDto?]{
        
        const {name, email, password} = object
        
        if(!name) return ["name is required"]
        if(!email) return ["email is required"]
        if(! Validators.checkEmail.test(email)) return ["email is not valid"]
        if(!password) return ["password is required"]
        if( password.length < 6 )  return ["password too short"]
        

        return [undefined, new RegisterUserDto(name, email, password)]
    }

}