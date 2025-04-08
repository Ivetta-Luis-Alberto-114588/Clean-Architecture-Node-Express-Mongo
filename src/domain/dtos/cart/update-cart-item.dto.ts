export class UpdateCartItemDto {

    private constructor(
        public productId: string,
        public quantity: number, // La nueva cantidad total para el item
    ) { }

    static create(object: { [key: string]: any }): [string?, UpdateCartItemDto?] {
        const { productId, quantity } = object;

        if (!productId) return ['productId es requerido', undefined];
        // Validación simple para ID de MongoDB
        if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
            return ["productId debe ser un ID válido de MongoDB", undefined];
        }

        if (quantity === undefined) return ['quantity es requerido', undefined];
        // Permitimos cantidad 0 para eliminar el item, pero no negativo
        if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
            return ['quantity debe ser un número entero no negativo', undefined];
        }

        return [undefined, new UpdateCartItemDto(productId, quantity)];
    }
}