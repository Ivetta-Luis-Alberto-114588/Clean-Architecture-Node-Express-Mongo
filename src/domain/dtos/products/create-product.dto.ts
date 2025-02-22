

export class CreateProductDto {

    private constructor(
        public name: string,
        public description: string,
        public price: number,
        public stock: number,
        public category: string, // CategoryEntity,
        public unit: string, // UnitEntity,
        public imgUrl: string,
        public isActive: boolean = true,
    ){}


      //este metodo va a devolver una instancia de la clase actual o un array con un string y undefined
    static create( object: {[key: string]:any} ) : [string?, CreateProductDto?] {
                 // object("name": string)       [error, instancia del dto]
        

        // desestructo el objeto que estoy esperando
        const { name, description, price, stock, category, unit, imgUrl, isActive } = object;


        //aca estan las validaciones necesarias y siempre debo devolver una tupla, 2 valores
        if(!name) return ["name is required"];
        if(!description) return ["description is required"];
        if(!price || price < 0 ) return ["price is required and greater than 0"];
        if(!stock || stock < 0 ) return ["stock is required and greater than 0"];
        if(!category) return ["category is required"];
        if(!unit) return ["unit is required"];
        if(!imgUrl) return ["imgUrl is required"];
        if(!isActive) return ["isActive is required"];

    

        
        //como no hay error devuelvo undefined y la instancia del dto (que es privada)
        return [undefined, new CreateProductDto(name.toLowerCase(), description.toLowerCase(), price, stock, category, unit, imgUrl, isActive)];
    }
}