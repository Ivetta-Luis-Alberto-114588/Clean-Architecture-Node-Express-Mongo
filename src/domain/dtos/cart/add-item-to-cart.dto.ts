export class AddItemToCartDto {

    private constructor(
        public productId: string,
        public quantity: number,
    ) { }

    static create(object: { [key: string]: any }): [string?, AddItemToCartDto?] {
        const { productId, quantity } = object;

        if (!productId) return ['productId es requerido', undefined];
        // Validación simple para ID de MongoDB
        if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
            return ["productId debe ser un ID válido de MongoDB", undefined];
        }

        if (quantity === undefined) return ['quantity es requerido', undefined];
        if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
            return ['quantity debe ser un número entero positivo', undefined];
        }

        return [undefined, new AddItemToCartDto(productId, quantity)];
    }
}