export class CreateNeighborhoodDto {
    private constructor(
        public name: string,
        public description: string,
        public cityId: string, // Usamos cityId en lugar de la entidad completa
        public isActive: boolean = true
    ) {}

    static create(object: {[key:string]:any}): [string?, CreateNeighborhoodDto?] {
        // Extraemos los valores del objeto
        const { name, description, cityId, isActive = true } = object;

        // Validaciones
        if (!name) return ["name es requiredo", undefined];
        if (name.length < 3) return ["name debe tener al menos 2 caracteres", undefined];
        
        if (!description) return ["description es requiredo", undefined];
        
        if (!cityId) return ["cityId es requiredo", undefined];
        
        // Validación simple para ID de MongoDB
        if (!/^[0-9a-fA-F]{24}$/.test(cityId)) {
            return ["cityId debe ser un id valido para MongoDB", undefined];
        }
        
        // Validamos que isActive sea un booleano si viene en la petición
        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return ["isActive debe ser un valor boleano", undefined];
        }

        // Creamos el DTO con valores sanitizados
        return [
            undefined, 
            new CreateNeighborhoodDto(
                name.trim().toLowerCase(), 
                description.trim().toLowerCase(),
                cityId,
                isActive
            )
        ];
    }
}