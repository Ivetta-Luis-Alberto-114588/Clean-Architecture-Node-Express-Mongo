export class UpdateOrderStatusDto {
    private constructor(
        public status: 'pending' | 'completed' | 'cancelled',
        public notes?: string
    ) { }

    static update(object: { [key: string]: any }): [string?, UpdateOrderStatusDto?] {
        const { status, notes } = object;

        // Validar que el estado sea válido
        if (!status) return ["status es requerido", undefined];
        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return ["status debe ser 'pending', 'completed' o 'cancelled'", undefined];
        }

        return [
            undefined,
            new UpdateOrderStatusDto(
                status as 'pending' | 'completed' | 'cancelled',
                notes
            )
        ];
    }
}