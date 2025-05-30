// src/domain/dtos/order/update-order-status.dto.ts
import mongoose from "mongoose";

export class UpdateOrderStatusDataDto {
    private constructor(
        public name?: string,
        public description?: string,
        public color?: string,
        public order?: number,
        public isActive?: boolean,
        public isDefault?: boolean,
        public canTransitionTo?: string[]
    ) { }

    static update(object: { [key: string]: any }): [string?, UpdateOrderStatusDataDto?] {
        const { name, description, color, order, isActive, isDefault, canTransitionTo } = object;

        const updateData: any = {};

        // Validaciones opcionales
        if (name !== undefined) {
            if (name.trim().length < 2) {
                return ['Nombre debe tener al menos 2 caracteres', undefined];
            }
            updateData.name = name.trim();
        }

        if (description !== undefined) {
            if (description.trim().length < 5) {
                return ['Descripción debe tener al menos 5 caracteres', undefined];
            }
            updateData.description = description.trim();
        }

        if (color !== undefined) {
            const colorTrimmed = color.trim();
            if (colorTrimmed && !/^#[0-9A-F]{6}$/i.test(colorTrimmed)) {
                return ['Color debe estar en formato hexadecimal (#RRGGBB)', undefined];
            }
            updateData.color = colorTrimmed || '#6c757d';
        }

        if (typeof order === 'number') {
            if (order < 0) {
                return ['El orden debe ser un número positivo', undefined];
            }
            updateData.order = order;
        }

        if (typeof isActive === 'boolean') {
            updateData.isActive = isActive;
        }

        if (typeof isDefault === 'boolean') {
            updateData.isDefault = isDefault;
        }

        if (Array.isArray(canTransitionTo)) {
            // Validar que todos los IDs sean válidos
            for (const id of canTransitionTo) {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return [`ID de transición inválido: ${id}`, undefined];
                }
            }
            updateData.canTransitionTo = canTransitionTo;
        }

        return [
            undefined,
            new UpdateOrderStatusDataDto(
                updateData.name,
                updateData.description,
                updateData.color,
                updateData.order,
                updateData.isActive,
                updateData.isDefault,
                updateData.canTransitionTo
            )
        ];
    }
}
