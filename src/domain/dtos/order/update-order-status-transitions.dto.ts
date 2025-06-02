// src/domain/dtos/order/update-order-status-transitions.dto.ts

export class UpdateOrderStatusTransitionsDto {
    constructor(
        public readonly canTransitionTo: string[]
    ) { }

    static create(object: { [key: string]: any }): [string?, UpdateOrderStatusTransitionsDto?] {
        const { canTransitionTo } = object;

        if (!canTransitionTo) {
            return ['canTransitionTo es requerido'];
        }

        if (!Array.isArray(canTransitionTo)) {
            return ['canTransitionTo debe ser un array'];
        }

        if (canTransitionTo.length === 0) {
            return ['canTransitionTo no puede estar vacío'];
        }

        const validTransitions = canTransitionTo.filter((transition: any) => {
            return typeof transition === 'string' && transition.trim().length > 0;
        });

        if (validTransitions.length !== canTransitionTo.length) {
            return ['Todas las transiciones deben ser strings válidos'];
        }

        return [undefined, new UpdateOrderStatusTransitionsDto(validTransitions)];
    }
}
