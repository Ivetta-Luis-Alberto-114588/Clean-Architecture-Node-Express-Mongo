

//es similiar a como lucen en la bd, pero no es lo mismo
//se hace para que no este ligada a la bd y no haya 
//problemas si se modifica la bd
export class UserEntity {
    
    constructor(
        public id: string, 
        public name: string,
        public email: string,
        public password: string,
        public role: string[],
        public img?: string

    ){}
}