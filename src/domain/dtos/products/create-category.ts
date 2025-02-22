

export class CreateCategoryDto {
  
    private constructor(
        public name: string,
        public description: string,
        public isActive: boolean = true
    ) { }


    //este metodo va a devolver una instancia de la clase actual o un array con un string y undefined
    static create(object: {[key:string]:any}): [string?, CreateCategoryDto?] {
            // object("name": string)       [error, instancia del dto]

        // desestructo el objeto que estoy esperando
        const { name, description, isActive } = object

        //aca estan las validaciones necesarias y siempre debo devolver una tupla, 2 valores
        if (!name) return ["name is required", undefined]
        if (!description) return ["description is required", undefined]
        if (!isActive) return ["isActive is required", undefined]


        //como no hay error devuelvo undefined y la instancia del dto (que es privada)
        return [undefined, new CreateCategoryDto(name.toLowerCase(), description.toLowerCase(), isActive)]
    }
}
