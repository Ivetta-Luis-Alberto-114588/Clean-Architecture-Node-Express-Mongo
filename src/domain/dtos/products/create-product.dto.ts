

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
        public taxRate: number = 21,
        public tags?: string[]    ) { }
    
    //este metodo va a devolver una instancia de la clase actual o un array con un string y undefined
    static create(object: { [key: string]: any }): [string?, CreateProductDto?] {
        // object("name": string)       [error, instancia del dto]

        // desestructo el objeto que estoy esperando
        const { name, description, price, stock, category, unit, imgUrl, isActive, taxRate = 21, tags = [] } = object;

        //aca estan las validaciones necesarias y siempre debo devolver una tupla, 2 valores
        if (!name) return ["name is required"];
        if (!description) return ["description is required"];
        if (!price || price < 0) return ["price is required and greater than 0"];
        if (!stock || stock < 0) return ["stock is required and greater than 0"]; if (!category) return ["category is required"];
        if (!unit) return ["unit is required"];
        // imgUrl can be empty string when no image is uploaded
        if (imgUrl === undefined || imgUrl === null) return ["imgUrl is required"];
        if (isActive !== undefined && typeof isActive !== 'boolean') return ["isActive must be a boolean"];
        if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
            return ["taxRate debe ser un número entre 0 y 100", undefined];
        };
        // <<<--- VALIDACIÓN PARA TAGS --- >>>
        let processedTags: string[] = [];
        if (tags) {
            if (!Array.isArray(tags)) {
                // Si viene como string separado por comas (desde form-data por ej.)
                if (typeof tags === 'string') {
                    processedTags = tags.split(',')
                        .map(tag => tag.trim().toLowerCase())
                        .filter(tag => tag.length > 0);
                } else {
                    return ["tags debe ser un array de strings o un string separado por comas", undefined];
                }
            } else {
                // Si ya es un array, validar que todos sean strings
                if (!tags.every(tag => typeof tag === 'string')) {
                    return ["Todos los elementos en tags deben ser strings", undefined];
                }
                processedTags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
            }
        }        // <<<--- FIN VALIDACIÓN TAGS --- >>>




        //como no hay error devuelvo undefined y la instancia del dto (que es privada)
        return [
            undefined,
            new CreateProductDto(
                name.toLowerCase(),
                description.toLowerCase(),
                Number(price), // Asegurar que price sea número
                Number(stock ?? 0), // Asegurar que stock sea número o 0
                category,
                unit,
                imgUrl || '',
                isActive !== undefined ? isActive : true, // Default to true if undefined
                taxRate,
                processedTags
            )];
    }
}