import { Validators } from "../../../configs/validator";

export class UpdateCustomerDto {
    private constructor(
        public name?: string,
        public email?: string,
        public phone?: string,
        public address?: string,
        public neighborhoodId?: string,
        public isActive?: boolean,
        public userId?: string // Added userId to allow updating this field
    ) { }

    static update(object: { [key: string]: any }): [string?, UpdateCustomerDto?] {

        // Verificamos que al menos se proporcione un campo para actualizar
        if (Object.keys(object).length === 0) {
            return ["Debe proporcionar al menos un campo para actualizar", undefined];
        }

        const { name, email, phone, address, neighborhoodId, isActive } = object;
        const updateData: any = {};

        // Validamos cada campo solo si está presente
        if (name !== undefined) {
            if (name.length < 2) {
                return ["El nombre debe tener al menos 2 caracteres", undefined];
            }
            updateData.name = name.trim().toLowerCase();
        }

        if (email !== undefined) {
            if (!Validators.checkEmail.test(email)) {
                return ["El formato del email no es válido", undefined];
            }
            updateData.email = email.trim().toLowerCase();
        }

        if (phone !== undefined) {
            if (!/^\+?[\d\s-]{8,15}$/.test(phone)) {
                return ["El formato del teléfono no es válido", undefined];
            }
            updateData.phone = phone.trim();
        }

        if (address !== undefined) {
            if (address.length < 5) {
                return ["La dirección debe tener al menos 5 caracteres", undefined];
            }
            updateData.address = address.trim().toLowerCase();
        }

        if (neighborhoodId !== undefined) {
            if (!/^[0-9a-fA-F]{24}$/.test(neighborhoodId)) {
                return ["neighborhoodId debe ser un id de MongoDB válido", undefined];
            }
            updateData.neighborhoodId = neighborhoodId;
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
            new UpdateCustomerDto(
                updateData.name, // Ya no necesita toLowerCase() aquí
                updateData.email, // Ya no necesita toLowerCase() aquí
                updateData.phone,
                updateData.address, // Ya no necesita toLowerCase() aquí
                updateData.neighborhoodId,
                updateData.isActive
            )
        ];
    }
}