

export class UpdateCategoryDto {
    private constructor(
        public name?: string,
        public description?: string,
        public isActive?: boolean
    ){}

    static update(object: {[key:string]: any}): [string?, UpdateCategoryDto?] {
        // Si el objeto está completamente vacío, devolvemos un error
        if (Object.keys(object).length === 0) {
            return ["Debe proporcionar al menos un campo para actualizar", undefined];
        }

        const { name, description, isActive } = object;

        // Validamos el tipo de isActive si está presente
        if ('isActive' in object && typeof isActive !== 'boolean') {
            return ["isActive debe ser un valor booleano", undefined];
        }

        // Validamos el nombre si está presente
        if (name !== undefined && name.length < 2) {
            return ["El nombre debe tener al menos 2 caracteres", undefined];
        }

        // Creamos un objeto solo con los campos proporcionados
        const updateData: any = {};
        
        if (name !== undefined) updateData.name = name.toLowerCase();
        if (description !== undefined) updateData.description = description.toLowerCase();
        if (isActive !== undefined) updateData.isActive = isActive;

        return [undefined, new UpdateCategoryDto(
            updateData.name,
            updateData.description,
            updateData.isActive
        )];
    }
}