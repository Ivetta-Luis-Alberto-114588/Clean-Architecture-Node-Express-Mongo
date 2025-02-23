

export class UpdateUnitDto {
    private constructor(
        public name?: string,
        public description?: string,
        public isActive?: boolean
    ){}

    static update(object: {[key:string]: any}): [string?, UpdateUnitDto?] {
        // Verificamos que al menos se proporcione un campo para actualizar
        if (Object.keys(object).length === 0) {
            return ["Debe proporcionar al menos un campo para actualizar", undefined];
        }

        const { name, description, isActive } = object;

        // Creamos un objeto para almacenar los campos a actualizar
        const updateData: any = {};

        // Validamos cada campo solo si está presente en la solicitud
        
        // Validación del nombre (si se proporciona)
        if (name !== undefined) {
            if (name.length < 2) {
                return ["El nombre debe tener al menos 2 caracteres", undefined];
            }
            updateData.name = name.toLowerCase();
        }

        // Validación de la descripción (si se proporciona)
        if (description !== undefined) {
            updateData.description = description.toLowerCase();
        }

        // Validación del estado activo (si se proporciona)
        if ('isActive' in object) {
            if (typeof isActive !== 'boolean') {
                return ["isActive debe ser un valor booleano", undefined];
            }
            updateData.isActive = isActive;
        }

        // Creamos una nueva instancia con solo los campos proporcionados
        return [undefined, new UpdateUnitDto(
            updateData.name,
            updateData.description,
            updateData.isActive
        )];
    }
}