// src/configs/price-calculator.ts
/**
 * Utilidades para cálculo correcto de precios
 * Flujo: Precio base -> Descuento -> IVA
 */

export interface PriceCalculation {
    basePrice: number;
    discountRate: number;
    discountAmount: number;
    priceAfterDiscount: number;
    taxRate: number;
    taxAmount: number;
    finalPrice: number;
}

export class PriceCalculator {
    /**
     * Calcula el precio final siguiendo el flujo correcto:
     * 1. Aplica descuento al precio base
     * 2. Calcula IVA sobre el precio descontado
     * 3. Suma IVA al precio descontado
     */
    static calculatePrice(basePrice: number, discountRate: number = 0, taxRate: number = 21): PriceCalculation {
        // 1. Calcular descuento
        const discountAmount = Math.round(basePrice * (discountRate / 100) * 100) / 100;
        const priceAfterDiscount = Math.round((basePrice - discountAmount) * 100) / 100;

        // 2. Calcular IVA sobre el precio descontado
        const taxAmount = Math.round(priceAfterDiscount * (taxRate / 100) * 100) / 100;

        // 3. Precio final
        const finalPrice = Math.round((priceAfterDiscount + taxAmount) * 100) / 100;

        return {
            basePrice,
            discountRate,
            discountAmount,
            priceAfterDiscount,
            taxRate,
            taxAmount,
            finalPrice
        };
    }    /**
     * Calcula el precio final de un item del carrito
     */
    static calculateCartItemPrice(basePrice: number, quantity: number, discountRate: number = 0, taxRate: number = 21) {
        const itemCalculation = this.calculatePrice(basePrice, discountRate, taxRate);
        const subtotalWithTax = Math.round(itemCalculation.finalPrice * quantity * 100) / 100;

        return {
            ...itemCalculation,
            quantity,
            unitPriceWithTax: itemCalculation.finalPrice,
            subtotalWithTax
        };
    }

    /**
     * Calcula totales de múltiples items
     */
    static calculateTotals(items: Array<{ basePrice: number, quantity: number, discountRate?: number, taxRate: number }>) {
        let totalSubtotal = 0; // Precio después del descuento pero antes del IVA
        let totalTaxAmount = 0;
        let totalDiscountAmount = 0;
        let finalTotal = 0;

        const calculatedItems = items.map(item => {
            const calculation = this.calculateCartItemPrice(
                item.basePrice,
                item.quantity,
                item.discountRate || 0,
                item.taxRate
            );

            // El subtotal es el precio después del descuento por cantidad (antes del IVA)
            totalSubtotal += calculation.priceAfterDiscount * calculation.quantity;
            totalTaxAmount += calculation.taxAmount * calculation.quantity;
            totalDiscountAmount += calculation.discountAmount * calculation.quantity;
            finalTotal += calculation.subtotalWithTax;

            return calculation;
        });

        return {
            items: calculatedItems,
            totalSubtotal: Math.round(totalSubtotal * 100) / 100,
            totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
            totalDiscountAmount: Math.round(totalDiscountAmount * 100) / 100,
            finalTotal: Math.round(finalTotal * 100) / 100
        };
    }
}
