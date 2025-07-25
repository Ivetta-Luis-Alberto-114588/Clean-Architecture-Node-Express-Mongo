import { Validators } from "../../../configs/validator";

export class CreateCustomerDto {
    private constructor(
        public name: string,
        public email: string,
        public phone: string,
        public address: string,
        public neighborhoodId?: string, // Hacemos neighborhoodId opcional
        public isActive: boolean = true,
        public userId?: string | null
    ) { }

    static create(object: { [key: string]: any }): [string?, CreateCustomerDto?] {
        // Extraemos los valores del objeto
        const { name, email, phone, address, neighborhoodId, isActive = true, userId = null } = object;

        // Validaciones
        if (!name) return ["name es requerido", undefined];
        if (name.length < 3) return ["name debe tener al menos 3 caracteres", undefined];

        if (!email) return ["email es requerido", undefined];
        if (!Validators.checkEmail.test(email)) return ["email no tiene un formato valido", undefined];

        if (!phone) return ["phone es requerido", undefined];
        // Validación básica de teléfono (puede ajustarse según requisitos)
        if (!/^\+?[\d\s-]{8,15}$/.test(phone)) {
            return ["phone no tiene un formato valido", undefined];
        }

        if (!address) return ["address es requerido", undefined];
        if (address.length < 5) return ["address debe tener al menos 4 caracteres", undefined];

        // neighborhoodId es opcional ahora (para casos como PICKUP)
        if (neighborhoodId) {
            // Validación simple para ID de MongoDB solo si se proporciona
            if (!/^[0-9a-fA-F]{24}$/.test(neighborhoodId)) {
                return ["neighborhoodId debe ser un id valido para MongoDB", undefined];
            }
        }

        // Validamos que isActive sea un booleano si viene en la petición
        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return ["isActive debe ser un valor boleano", undefined];
        }

        // <<<--- validación opcional para userId si viene ---<<<
        if (userId && (typeof userId !== 'string' /* || !mongoose.Types.ObjectId.isValid(userId) */)) {
            return ["userId debe ser un string válido (ObjectId) si se proporciona", undefined];
        }

        // Creamos el DTO con valores sanitizados
        return [
            undefined,
            new CreateCustomerDto(
                name.trim().toLowerCase(),
                email.trim().toLowerCase(),
                phone.trim(),
                address.trim().toLowerCase(),
                neighborhoodId,
                isActive,
                userId
            )
        ];
    }
}