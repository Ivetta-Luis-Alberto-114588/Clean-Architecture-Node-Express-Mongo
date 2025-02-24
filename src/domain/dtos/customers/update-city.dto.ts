export class UpdateCityDto {
    private constructor(
        public name?: string,
        public description?: string,
        public isActive?: boolean
    ) {}

    static update(object: {[key:string]:any}): [string?, UpdateCityDto?] {
        // Verificamos que al menos se proporcione un campo para actualizar
        if (Object.keys(object).length === 0) {
            return ["Debe proporcionar al menos un campo para actualizar", undefined];
        }

        const { name, description, isActive } = object;
        const updateData: any = {};

        // Validamos cada campo solo si está presente
        if (name !== undefined) {
            if (name.length < 3) {
                return ["El nombre debe tener al menos 3 caracteres", undefined];
            }
            updateData.name = name.trim().toLowerCase();
        }

        if (description !== undefined) {
            updateData.description = description.trim().toLowerCase();
        }

        if ('isActive' in object) {
            if (typeof isActive !== 'boolean') {
                return ["isActive debe ser un valor booleano", undefined];
            }
            updateData.isActive = isActive;
        }

        // Creamos el DTO solo con los campos proporcionados
        return [
            undefined, 
            new UpdateCityDto(
                updateData.name.toLowerCase(),
                updateData.description.toLowerCase(),
                updateData.isActive
            )
        ];
    }
}