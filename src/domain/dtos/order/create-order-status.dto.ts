// src/domain/dtos/order/create-order-status.dto.ts
import mongoose from "mongoose";

export class CreateOrderStatusDto {
    private constructor(
        public code: string,
        public name: string,
        public description: string,
        public color: string = '#6c757d',
        public order: number = 0,
        public isActive: boolean = true,
        public isDefault: boolean = false,
        public canTransitionTo: string[] = []
    ) { }

    static create(object: { [key: string]: any }): [string?, CreateOrderStatusDto?] {
        const { code, name, description, color, order, isActive, isDefault, canTransitionTo } = object;

        // Validaciones
        if (!code || code.trim().length < 2) {
            return ['Código es requerido (mínimo 2 caracteres)', undefined];
        }
        if (!name || name.trim().length < 2) {
            return ['Nombre es requerido (mínimo 2 caracteres)', undefined];
        }
        if (!description || description.trim().length < 5) {
            return ['Descripción es requerida (mínimo 5 caracteres)', undefined];
        }

        // Validar formato de color si se proporciona
        if (color && !/^#[0-9A-F]{6}$/i.test(color.trim())) {
            return ['Color debe estar en formato hexadecimal (#RRGGBB)', undefined];
        }

        // Validar IDs en canTransitionTo si se proporciona
        if (canTransitionTo && Array.isArray(canTransitionTo)) {
            for (const id of canTransitionTo) {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return [`ID de transición inválido: ${id}`, undefined];
                }
            }
        }

        const finalCode = code.trim().toUpperCase();
        const finalName = name.trim();
        const finalDescription = description.trim();
        const finalColor = color?.trim() || '#6c757d';
        const finalOrder = typeof order === 'number' ? order : 0;
        const finalIsActive = typeof isActive === 'boolean' ? isActive : true;
        const finalIsDefault = typeof isDefault === 'boolean' ? isDefault : false;
        const finalCanTransitionTo = Array.isArray(canTransitionTo) ? canTransitionTo : [];

        return [
            undefined,
            new CreateOrderStatusDto(
                finalCode,
                finalName,
                finalDescription,
                finalColor,
                finalOrder,
                finalIsActive,
                finalIsDefault,
                finalCanTransitionTo
            )
        ];
    }
}
