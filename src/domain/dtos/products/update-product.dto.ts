

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

         // Validamos el tipo de isActive si está presente
         if ('isActive' in object && typeof isActive !== 'boolean') {
            return ["isActive debe ser un valor booleano", undefined];
        }

        // Creamos un objeto solo con los campos proporcionados
        const updateData: any = {};

        if (name !== undefined) updateData.name = name.toLowerCase();
        if (description !== undefined) updateData.description = description.toLowerCase();
        if (isActive !== undefined) updateData.isActive = isActive;

        return [undefined, new UpdateProductDto(
            updateData.name.toLowerCase(), 
            updateData.description.toLowerCase(), 
            price,
            stock,
            category,
            unit,
            imgUrl, 
            updateData.isActive)];
    }
}