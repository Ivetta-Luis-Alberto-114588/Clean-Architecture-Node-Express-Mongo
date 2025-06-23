/**
 * Flujo: Precio base -> Descuento -> IVA
 */

import { CustomError } from '../domain/errors/custom.error';

interface CartItemCalculation {
    quantity: number;
    unitPrice: number;
    taxRate?: number;
}

interface ProductCalculationItem {
    basePrice: number;
    quantity: number;
    discountRate?: number;
    taxRate: number;
}

interface PriceCalculationResult {
    subtotalBeforeTax: number;      // Precio base total (sin descuento, sin IVA)
    subtotalAfterDiscount: number;  // Precio después del descuento (sin IVA)
    subtotalBeforeDiscount: number; // Precio con IVA pero sin descuento
    discountAmount: number;         // Total de descuentos aplicados
    taxAmount: number;              // Total de IVA sobre precio descontado
    finalPrice: number;             // Precio final (con descuento + IVA)
}

export class PriceCalculator {    /**
     * Valida que los items sean válidos para cálculo
     */
    private static validateItems(items: any[]): void {
        if (!Array.isArray(items) || items.length === 0) {
            throw CustomError.badRequest('Items array cannot be empty');
        }

        items.forEach((item, index) => {
            if (item.quantity === undefined || item.quantity <= 0) {
                throw CustomError.badRequest(`Item ${index + 1}: quantity must be greater than 0`);
            }
            // Si el item tiene `unitPrice`, es para `calculatePrice`. Si no, debe tener `basePrice` para `calculateTotals`.
            if (item.unitPrice === undefined && item.basePrice === undefined) {
                throw CustomError.badRequest(`Item ${index + 1}: must have either unitPrice or basePrice`);
            }
            if (item.unitPrice !== undefined && item.unitPrice < 0) {
                throw CustomError.badRequest(`Item ${index + 1}: unitPrice must be greater than or equal to 0`);
            }
            if (item.basePrice !== undefined && item.basePrice < 0) {
                throw CustomError.badRequest(`Item ${index + 1}: basePrice must be greater than or equal to 0`);
            }
            if (item.taxRate === undefined || item.taxRate < 0 || item.taxRate > 100) {
                throw CustomError.badRequest(`Item ${index + 1}: taxRate must be between 0 and 100`);
            }
        });
    }

    /**
     * Valida que el discount rate sea válido
     */
    private static validateDiscountRate(discountRate: number): void {
        if (discountRate < 0 || discountRate > 100) {
            throw CustomError.badRequest('Discount rate must be between 0 and 100');
        }
    }

    /**
     * Calcula el precio final siguiendo el flujo correcto:
     * 1. Aplica descuento al precio base
     * 2. Calcula IVA sobre el precio descontado (respetando taxRate de cada item)
     * 3. Suma IVA al precio descontado
     */
    static calculatePrice(items: Array<CartItemCalculation>, discountRate: number = 0): PriceCalculationResult {
        this.validateItems(items);
        this.validateDiscountRate(discountRate);

        let subtotalBeforeTax = 0;
        let subtotalBeforeDiscount = 0;

        // Calcular subtotales por item
        items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = itemSubtotal * (item.taxRate || 0) / 100;

            subtotalBeforeTax += itemSubtotal;
            subtotalBeforeDiscount += itemSubtotal + itemTax;
        });

        // Aplicar descuento ANTES del IVA
        const discountAmount = Math.round(subtotalBeforeTax * (discountRate / 100) * 100) / 100;
        const subtotalAfterDiscount = Math.round((subtotalBeforeTax - discountAmount) * 100) / 100;

        // Calcular IVA sobre precio descontado (CORREGIDO: respeta taxRate por item)
        let taxAmount = 0;
        items.forEach(item => {
            const itemSubtotalAfterDiscount = (item.quantity * item.unitPrice) * (1 - discountRate / 100);
            const itemTaxAfterDiscount = itemSubtotalAfterDiscount * (item.taxRate || 0) / 100;
            taxAmount += itemTaxAfterDiscount;
        });
        taxAmount = Math.round(taxAmount * 100) / 100;

        const finalPrice = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;

        return {
            subtotalBeforeTax,
            subtotalAfterDiscount,
            subtotalBeforeDiscount,
            discountAmount,
            taxAmount,
            finalPrice
        };
    }

    /**
     * Calcula el precio de un solo item (basePrice, discountRate, taxRate)
     */
    static calculateSingleItemPrice(basePrice: number, discountRate: number = 0, taxRate: number = 21) {
        if (basePrice < 0) throw CustomError.badRequest('Base price cannot be negative');
        this.validateDiscountRate(discountRate);
        if (taxRate < 0 || taxRate > 100) throw CustomError.badRequest('Tax rate must be between 0 and 100');

        const discountAmount = Math.round(basePrice * (discountRate / 100) * 100) / 100;
        const priceAfterDiscount = Math.round((basePrice - discountAmount) * 100) / 100;
        const taxAmount = Math.round(priceAfterDiscount * (taxRate / 100) * 100) / 100;
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
    }

    /**
     * Calcula el precio final de un item del carrito
     */
    static calculateCartItemPrice(basePrice: number, quantity: number, discountRate: number = 0, taxRate: number = 21) {
        if (quantity <= 0) throw CustomError.badRequest('Quantity must be greater than 0');

        const itemCalculation = this.calculateSingleItemPrice(basePrice, discountRate, taxRate);
        const subtotalWithTax = Math.round(itemCalculation.finalPrice * quantity * 100) / 100;

        return {
            ...itemCalculation,
            quantity,
            unitPriceWithTax: itemCalculation.finalPrice,
            subtotalWithTax
        };
    }

    /**
     * Calcula totales de múltiples items con descuentos individuales
     */
    static calculateTotals(items: Array<ProductCalculationItem>) {
        this.validateItems(items);

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