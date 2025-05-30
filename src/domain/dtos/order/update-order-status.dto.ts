import mongoose from "mongoose";

export class UpdateOrderStatusDto {
    private constructor(
        public statusId: string,
        public notes?: string
    ) { }

    static update(object: { [key: string]: any }): [string?, UpdateOrderStatusDto?] {
        const { statusId, notes } = object;

        // Validar que el statusId sea válido
        if (!statusId) return ["statusId es requerido", undefined];

        if (typeof statusId !== 'string') {
            return ["statusId debe ser una cadena de texto", undefined];
        }

        if (!mongoose.Types.ObjectId.isValid(statusId)) {
            return ["statusId debe ser un ObjectId válido", undefined];
        }

        // Validar notas si se proporcionan
        if (notes !== undefined) {
            if (typeof notes !== 'string') {
                return ["notes debe ser una cadena de texto", undefined];
            }
            if (notes.length > 500) {
                return ["notes no puede exceder 500 caracteres", undefined];
            }
        }

        return [
            undefined,
            new UpdateOrderStatusDto(
                statusId,
                notes
            )
        ];
    }
}