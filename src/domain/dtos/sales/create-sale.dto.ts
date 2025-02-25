// src/domain/dtos/sales/create-sale.dto.ts
export class CreateSaleDto {
    private constructor(
        public customerId: string,
        public items: Array<{
            productId: string,
            quantity: number,
            unitPrice: number
        }>,
        public taxRate: number = 21,
        public discountRate: number = 0,
        public notes: string = ""
    ) {}

    static create(object: {[key:string]:any}): [string?, CreateSaleDto?] {
        const { customerId, items, taxRate = 21, discountRate = 0, notes = "" } = object;

        // Validaciones
        if (!customerId) return ["customerId es requerido", undefined];
        if (!/^[0-9a-fA-F]{24}$/.test(customerId)) {
            return ["customerId debe ser un id válido para MongoDB", undefined];
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return ["items debe ser un array no vacío", undefined];
        }

        // Validar cada item
        for (const item of items) {
            if (!item.productId) {
                return ["productId es requerido para cada item", undefined];
            }
            if (!/^[0-9a-fA-F]{24}$/.test(item.productId)) {
                return ["productId debe ser un id válido para MongoDB", undefined];
            }
            if (!item.quantity || item.quantity < 1) {
                return ["quantity debe ser un número mayor a 0", undefined];
            }
            if (item.unitPrice === undefined || item.unitPrice < 0) {
                return ["unitPrice debe ser un número no negativo", undefined];
            }
        }
        
        // Validar taxRate y discountRate
        if (taxRate < 0 || taxRate > 100) {
            return ["taxRate debe estar entre 0 y 100", undefined];
        }
        
        if (discountRate < 0 || discountRate > 100) {
            return ["discountRate debe estar entre 0 y 100", undefined];
        }

        return [
            undefined, 
            new CreateSaleDto(
                customerId,
                items,
                taxRate,
                discountRate,
                notes
            )
        ];
    }
}

