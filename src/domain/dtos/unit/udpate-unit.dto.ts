

export class UpdateUnitDto {
    private constructor(
        public name?: string,
        public description?: string,
        public isActive?: boolean 
    ){}

    //este metodo va a devolver una instancia de la clase actual o un array con un string y undefined
    static update(object: {[key:string]:any}): [string?, UpdateUnitDto?]{
             // object("name": string)       [error, instancia del dto]
        
        // desestructo el objeto que estoy esperando
        const {name, description, isActive} = object



        //aca verifico si el objeto esta vacio
        if (Object.keys(object).length === 0) 
            return ["Se debe proporcionar al menos un campo para actualizar"];


        //como no hay error devuelvo undefined y la instancia del dto (que es priv
        return [undefined, new UpdateUnitDto(name.toLowerCase(), description.toLowerCase(), isActive)]
    }
}