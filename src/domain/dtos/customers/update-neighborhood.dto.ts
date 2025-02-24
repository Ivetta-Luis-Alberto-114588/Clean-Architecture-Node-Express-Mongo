export class UpdateNeighborhoodDto {
    private constructor(
        public name?: string,
        public description?: string,
        public cityId?: string,
        public isActive?: boolean
    ) {}

    static update(object: {[key:string]:any}): [string?, UpdateNeighborhoodDto?] {
        // Verificamos que al menos se proporcione un campo para actualizar
        if (Object.keys(object).length === 0) {
            return ["Debe proporcionar al menos un campo para actualizar", undefined];
        }

        const { name, description, cityId, isActive } = object;
        const updateData: any = {};

        // Validamos cada campo solo si está presente
        if (name !== undefined) {
            if (name.length < 3) {
                return ["name debe tener al menos 3 caracteres", undefined];
            }
            updateData.name = name.trim().toLowerCase();
        }

        if (description !== undefined) {
            updateData.description = description.trim().toLowerCase();
        }

        if (cityId !== undefined) {
            if (!/^[0-9a-fA-F]{24}$/.test(cityId)) {
                return ["cityId debe ser un id de MongoDB válido", undefined];
            }
            updateData.cityId = cityId;
        }

        if ('isActive' in object) {
            if (typeof isActive !== 'boolean') {
                return ["isActive debe ser un valor boleano", undefined];
            }
            updateData.isActive = isActive;
        }

        // Creamos el DTO solo con los campos proporcionados
        return [
            undefined, 
            new UpdateNeighborhoodDto(
                updateData.name.toLowerCase(),
                updateData.description.toLowerCase(),
                updateData.cityId,
                updateData.isActive
            )
        ];
    }
}