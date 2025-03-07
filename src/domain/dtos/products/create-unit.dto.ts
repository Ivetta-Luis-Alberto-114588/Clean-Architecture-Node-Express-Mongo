

export class CreateUnitDto{

    private constructor(
        public name: string,
        public description: string,
        public isActive: boolean = true
    ){}


    //este metodo va a devolver una instancia de la clase actual o un array con un string y undefined
    static create (object: {[key:string]:any}) : [string?, CreateUnitDto?]{
                 // object("name": string)       [error, instancia del dto]

        // desestructo el objeto que estoy esperando
        const {name, description, isActive} = object

        //aca estan las validaciones necesarias y siempre debo devolver una tupla, 2 valores
        if(!name) return ["name is required", undefined]
        if(!description) return ["description is required", undefined]
        
        // Validación mejorada para isActive
        if(isActive === undefined) return ["isActive is required", undefined]
        if(typeof isActive !== 'boolean') return ["isActive debe ser un valor booleano", undefined]

        //como no hay error devuelvo undefined y la instancia del dto (que es privada)
        return [undefined, new CreateUnitDto(name.toLowerCase(), description.toLowerCase(), isActive)]
    }
}