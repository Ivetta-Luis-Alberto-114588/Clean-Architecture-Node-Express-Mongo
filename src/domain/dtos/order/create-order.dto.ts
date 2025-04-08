export class CreateOrderDto {
    private constructor(
        public customerId: string,
        public items: Array<{
            productId: string,
            quantity: number,
            unitPrice: number // <<<--- AHORA DEBE SER PRECIO CON IVA
        }>,
        // Estos ahora son opcionales o para descuentos/impuestos globales
        public discountRate?: number, // Descuento general sobre el total (opcional)
        public notes?: string
        // taxRate ya no es necesario aquí si el IVA está en los items
    ) { }

    static create(object: { [key: string]: any }): [string?, CreateOrderDto?] {
        const { customerId, items, discountRate = 0, notes = "" } = object; // taxRate eliminado

        if (!customerId) return ["customerId es requerido", undefined];
        if (!/^[0-9a-fA-F]{24}$/.test(customerId)) {
            return ["customerId debe ser un id válido para MongoDB", undefined];
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return ["items debe ser un array no vacío", undefined];
        }

        for (const item of items) {
            if (!item.productId || !/^[0-9a-fA-F]{24}$/.test(item.productId)) {
                return ["productId debe ser un id válido para MongoDB para cada item", undefined];
            }
            if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity < 1) {
                return ["quantity debe ser un número entero mayor a 0", undefined];
            }
            // <<<--- unitPrice ahora es CON IVA --- >>>
            if (item.unitPrice === undefined || typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
                return ["unitPrice (con IVA) debe ser un número no negativo", undefined];
            }
        }

        // <<<--- discountRate ahora es opcional --- >>>
        if (discountRate < 0 || discountRate > 100) {
            return ["discountRate debe estar entre 0 y 100", undefined];
        }

        return [
            undefined,
            new CreateOrderDto(
                customerId,
                items, // Items ahora contienen precio CON IVA
                discountRate,
                notes
            )
        ];
    }
}