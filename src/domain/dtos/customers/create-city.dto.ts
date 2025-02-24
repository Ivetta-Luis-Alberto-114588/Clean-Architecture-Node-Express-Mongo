export class CreateCityDto {
    private constructor(
        public name: string,
        public description: string,
        public isActive: boolean = true
    ) {}

    static create(object: {[key:string]:any}): [string?, CreateCityDto?] {
        // Extraemos los valores del objeto
        const { name, description, isActive = true } = object;

        // Validaciones
        if (!name) return ["name is required", undefined];
        if (name.length < 3) return ["name debe tener al menos 3 caracteres", undefined];
        
        if (!description) return ["description es requiredo", undefined];
        
        // Validamos que isActive sea un booleano si viene en la petición
        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return ["isActive debe ser un valor booleano", undefined];
        }

        // Creamos el DTO con valores sanitizados
        return [
            undefined, 
            new CreateCityDto(
                name.trim().toLowerCase(), 
                description.trim().toLowerCase(), 
                isActive
            )
        ];
    }
}