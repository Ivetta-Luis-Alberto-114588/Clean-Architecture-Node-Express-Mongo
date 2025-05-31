// src/domain/dtos/order/update-order-status.dto.ts
import mongoose from "mongoose";

export class UpdateOrderStatusDataDto {
    public constructor(
        public code?: string,
        public name?: string,
        public description?: string,
        public color?: string,
        public order?: number,
        public isActive?: boolean,
        public isDefault?: boolean,
        public canTransitionTo?: string[]
    ) { }static update(object: { [key: string]: any }): [string?, UpdateOrderStatusDataDto?] {
        const { code, name, description, color, order, isActive, isDefault, canTransitionTo, allowedTransitions } = object;

        const updateData: any = {};

        // Validación del código
        if (code !== undefined) {
            if (typeof code !== 'string' || code.trim().length < 2) {
                return ['Código debe ser una cadena de al menos 2 caracteres', undefined];
            }
            updateData.code = code.trim();
        }

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
        }        if (Array.isArray(canTransitionTo) || Array.isArray(allowedTransitions)) {
            // Support both field names: canTransitionTo and allowedTransitions
            const transitionsArray = canTransitionTo || allowedTransitions;
            
            // Validar que todos los elementos sean válidos (ObjectIds o códigos de estado)
            for (const item of transitionsArray) {
                if (typeof item !== 'string' || item.trim().length === 0) {
                    return [`Elemento de transición inválido: debe ser un ObjectId válido o código de estado`, undefined];
                }
                
                // Si no es un ObjectId válido, debe ser un código de estado (al menos 2 caracteres)
                if (!mongoose.Types.ObjectId.isValid(item) && item.trim().length < 2) {
                    return [`Código de estado de transición inválido: ${item} (debe tener al menos 2 caracteres)`, undefined];
                }
            }
            updateData.canTransitionTo = transitionsArray;
        }return [
            undefined,
            new UpdateOrderStatusDataDto(
                updateData.code,
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
