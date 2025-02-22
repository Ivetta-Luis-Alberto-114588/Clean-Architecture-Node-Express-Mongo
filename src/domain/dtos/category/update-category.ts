

export class UpdateCategoryDto {

    private constructor(
        public name: string,
        public description: string,
        public isActive: boolean
    ){}


    //este metodo va a devolver una instancia de la clase actual o un array con un string y undefined
    static update (object: {[key:string]: any}) : [string?, UpdateCategoryDto?] {
                  // object("name": string)       [error, instancia del dto]

        // desestructo el objeto que estoy esperando
        const { name, description, isActive } = object

        //aca verifico si el objeto esta vacio
        if (Object.keys(object).length === 0) 
            return ["at least one field is required", undefined];


        //como no hay error devuelvo undefined y la instancia del dto (que es privada)
        return [undefined, new UpdateCategoryDto(name.toLowerCase(), description.toLowerCase(), isActive)]
    }
}