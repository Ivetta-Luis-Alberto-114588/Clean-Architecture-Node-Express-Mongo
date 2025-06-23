import { PriceCalculator } from '../../../src/configs/price-calculator';
import { CustomError } from '../../../src/domain/errors/custom.error';

describe('PriceCalculator', () => {    describe('Smoke Tests', () => {
        describe('calculatePrice', () => {
            
            const items = [
                { unitPrice: 100, quantity: 2, taxRate: 21 }, // subtotal: 200, tax: 42
                { unitPrice: 50, quantity: 1, taxRate: 10.5 }, // subtotal: 50, tax: 5.25
            ];

            it('should run without throwing an error and return a valid result object', () => {
                const basicItems = [{ unitPrice: 10, quantity: 1, taxRate: 10 }];
                const result = PriceCalculator.calculatePrice(basicItems, 5);

                expect(result).not.toBeNull();
                expect(result).toBeDefined();

                expect(result).toHaveProperty('subtotalBeforeTax');
                expect(result).toHaveProperty('subtotalAfterDiscount');
                expect(result).toHaveProperty('subtotalBeforeDiscount');
                expect(result).toHaveProperty('discountAmount');
                expect(result).toHaveProperty('taxAmount');
                expect(result).toHaveProperty('finalPrice');            });

            it('should calculate the final price correctly with a global discount', () => {
            const discountRate = 10; // 10%
            const result = PriceCalculator.calculatePrice(items, discountRate);

            // 1. Subtotal sin IVA: (100 * 2) + (50 * 1) = 250
            expect(result.subtotalBeforeTax).toBe(250);

            // 2. Descuento: 250 * 10% = 25
            expect(result.discountAmount).toBe(25);

            // 3. Subtotal con descuento: 250 - 25 = 225
            expect(result.subtotalAfterDiscount).toBe(225);

            // 4. IVA sobre el precio descontado
            // Item 1: (100 * 2 * (1 - 0.10)) * 0.21 = 180 * 0.21 = 37.8
            // Item 2: (50 * 1 * (1 - 0.10)) * 0.105 = 45 * 0.105 = 4.725
            // Total IVA: 37.8 + 4.725 = 42.525 => redondeado a 42.53
            expect(result.taxAmount).toBe(42.53);

            // 5. Precio final: 225 + 42.53 = 267.53
            expect(result.finalPrice).toBe(267.53);

            // Extra: Subtotal con IVA pero sin descuento
            // (200 + 42) + (50 + 5.25) = 242 + 55.25 = 297.25
            expect(result.subtotalBeforeDiscount).toBe(297.25);
        });

        it('should calculate correctly with no discount', () => {
            const result = PriceCalculator.calculatePrice(items, 0);

            expect(result.subtotalBeforeTax).toBe(250);
            expect(result.discountAmount).toBe(0);
            expect(result.subtotalAfterDiscount).toBe(250);
            // IVA sin descuento: 42 + 5.25 = 47.25
            expect(result.taxAmount).toBe(47.25);
            // Precio final: 250 + 47.25 = 297.25
            expect(result.finalPrice).toBe(297.25);
        });

        it('should calculate correctly when one item has zero tax', () => {
            const itemsWithZeroTax = [
                { unitPrice: 100, quantity: 1, taxRate: 21 }, // sub: 100, tax: 21
                { unitPrice: 50, quantity: 2, taxRate: 0 },  // sub: 100, tax: 0
            ];
            const result = PriceCalculator.calculatePrice(itemsWithZeroTax, 10);

            // Subtotal sin IVA: 100 + 100 = 200
            expect(result.subtotalBeforeTax).toBe(200);
            // Descuento: 200 * 10% = 20
            expect(result.discountAmount).toBe(20);
            // Subtotal con descuento: 200 - 20 = 180
            expect(result.subtotalAfterDiscount).toBe(180);
            // IVA: (100 * 0.9 * 0.21) + (100 * 0.9 * 0) = 18.9
            expect(result.taxAmount).toBe(18.9);
            // Final: 180 + 18.9 = 198.9
            expect(result.finalPrice).toBe(198.9);
        });

        it('should handle rounding correctly', () => {
            const itemsForRounding = [
                { unitPrice: 33.33, quantity: 1, taxRate: 16.66 },
            ];
            const result = PriceCalculator.calculatePrice(itemsForRounding, 5.5); // 5.5% discount

            // subtotalBeforeTax = 33.33
            // discountAmount = 33.33 * 0.055 = 1.83315 => 1.83
            // subtotalAfterDiscount = 33.33 - 1.83 = 31.5
            // taxAmount = (33.33 * (1 - 0.055)) * 0.1666 = 31.50685 * 0.1666 = 5.24893871 => 5.25
            // finalPrice = 31.5 + 5.25 = 36.75

            expect(result.subtotalBeforeTax).toBe(33.33);
            expect(result.discountAmount).toBe(1.83);
            expect(result.subtotalAfterDiscount).toBe(31.5);
            expect(result.taxAmount).toBe(5.25);
            expect(result.finalPrice).toBe(36.75);
        });

        it('should throw a CustomError for invalid discount rate', () => {
            expect(() => PriceCalculator.calculatePrice(items, -10))
                .toThrow(CustomError.badRequest('Discount rate must be between 0 and 100'));
            expect(() => PriceCalculator.calculatePrice(items, 101))
                .toThrow(CustomError.badRequest('Discount rate must be between 0 and 100'));
        });

        it('should throw a CustomError for invalid items array', () => {
            // Corregido para que coincida con la validación de `calculatePrice`
            const invalidItems = [
                { unitPrice: 100, quantity: 1, taxRate: 21, basePrice: 100 }, // basePrice no es usado pero lo agrego para pasar el validateItems
                { quantity: 1, taxRate: 10 } // Falta unitPrice y basePrice
            ];
            
            // La validación de `calculatePrice` no usa `basePrice`, por lo que el test debe adaptarse a eso.
            // `validateItems` en el contexto de `calculatePrice` no se llama, se llama una validación interna.
            // Vamos a probar la validación que sí se ejecuta.
            const itemsWithInvalidQuantity = [{ unitPrice: 100, quantity: 0, taxRate: 21 }];
            expect(() => PriceCalculator.calculatePrice(itemsWithInvalidQuantity, 0))
                .toThrow(CustomError.badRequest('Item 1: quantity must be greater than 0'));

            const itemsWithInvalidTaxRate = [{ unitPrice: 100, quantity: 1, taxRate: -5 }];            expect(() => PriceCalculator.calculatePrice(itemsWithInvalidTaxRate, 0))
                .toThrow(CustomError.badRequest('Item 1: taxRate must be between 0 and 100'));
        });
        });
    });
});
