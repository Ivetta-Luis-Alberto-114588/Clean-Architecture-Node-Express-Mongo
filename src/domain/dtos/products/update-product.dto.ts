

export class UpdateProductDto {

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


    static create( object: {[key: string]:any} ) : [string?, UpdateProductDto?] {
        const { name, description, price, stock, category, unit, imgUrl, isActive } = object;

        //aca verifico si el objeto esta vacio
        if (Object.keys(object).length === 0) 
            return ["at least one field is required", undefined];

        return [undefined, new UpdateProductDto(name.toLowerCase(), description.toLowerCase(), price, stock, category, unit, imgUrl, isActive)];
    }
}