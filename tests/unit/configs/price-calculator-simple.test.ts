// tests/unit/configs/price-calculator-simple.test.ts

import { PriceCalculator } from '../../../src/configs/price-calculator';

describe('PriceCalculator - Tests Simples', () => {

    describe('calculatePrice - Casos Básicos', () => {
        test('Precio sin descuento ni IVA', () => {
            const result = PriceCalculator.calculatePrice(100, 0, 0);

            expect(result.basePrice).toBe(100);
            expect(result.discountRate).toBe(0);
            expect(result.discountAmount).toBe(0);
            expect(result.priceAfterDiscount).toBe(100);
            expect(result.taxRate).toBe(0);
            expect(result.taxAmount).toBe(0);
            expect(result.finalPrice).toBe(100);
        });

        test('Precio con IVA 21% (sin descuento)', () => {
            const result = PriceCalculator.calculatePrice(100, 0, 21);

            expect(result.basePrice).toBe(100);
            expect(result.discountRate).toBe(0);
            expect(result.discountAmount).toBe(0);
            expect(result.priceAfterDiscount).toBe(100);
            expect(result.taxRate).toBe(21);
            expect(result.taxAmount).toBe(21); // 100 * 0.21 = 21
            expect(result.finalPrice).toBe(121); // 100 + 21 = 121
        });

        test('Precio con descuento 10% (sin IVA)', () => {
            const result = PriceCalculator.calculatePrice(100, 10, 0);

            expect(result.basePrice).toBe(100);
            expect(result.discountRate).toBe(10);
            expect(result.discountAmount).toBe(10); // 100 * 0.10 = 10
            expect(result.priceAfterDiscount).toBe(90); // 100 - 10 = 90
            expect(result.taxRate).toBe(0);
            expect(result.taxAmount).toBe(0);
            expect(result.finalPrice).toBe(90);
        });

        test('Precio con descuento 10% e IVA 21% - FLUJO CORRECTO', () => {
            const result = PriceCalculator.calculatePrice(100, 10, 21);

            expect(result.basePrice).toBe(100);
            expect(result.discountRate).toBe(10);
            expect(result.discountAmount).toBe(10); // 100 * 0.10 = 10
            expect(result.priceAfterDiscount).toBe(90); // 100 - 10 = 90
            expect(result.taxRate).toBe(21);
            expect(result.taxAmount).toBe(18.9); // 90 * 0.21 = 18.9
            expect(result.finalPrice).toBe(108.9); // 90 + 18.9 = 108.9
        });
    });

    describe('calculatePrice - Casos con Decimales', () => {
        test('Precio con decimales y descuento', () => {
            const result = PriceCalculator.calculatePrice(99.99, 15, 21);

            expect(result.basePrice).toBe(99.99);
            expect(result.discountAmount).toBe(15); // 99.99 * 0.15 = 14.9985 → 15.00
            expect(result.priceAfterDiscount).toBe(84.99); // 99.99 - 15.00 = 84.99
            expect(result.taxAmount).toBe(17.85); // 84.99 * 0.21 = 17.8479 → 17.85
            expect(result.finalPrice).toBe(102.84); // 84.99 + 17.85 = 102.84
        });

        test('Verificar redondeo a 2 decimales', () => {
            const result = PriceCalculator.calculatePrice(33.33, 33.33, 10.5);

            // Todos los valores deben tener máximo 2 decimales
            expect(Number.isInteger(result.discountAmount * 100)).toBe(true);
            expect(Number.isInteger(result.priceAfterDiscount * 100)).toBe(true);
            expect(Number.isInteger(result.taxAmount * 100)).toBe(true);
            expect(Number.isInteger(result.finalPrice * 100)).toBe(true);
        });
    });

    describe('calculatePrice - Diferentes IVA Argentina', () => {
        test('IVA 10.5% (productos básicos)', () => {
            const result = PriceCalculator.calculatePrice(50, 5, 10.5);

            expect(result.discountAmount).toBe(2.5); // 50 * 0.05 = 2.5
            expect(result.priceAfterDiscount).toBe(47.5); // 50 - 2.5 = 47.5
            expect(result.taxAmount).toBe(4.99); // 47.5 * 0.105 = 4.9875 → 4.99
            expect(result.finalPrice).toBe(52.49); // 47.5 + 4.99 = 52.49
        });

        test('IVA 27% (productos de lujo)', () => {
            const result = PriceCalculator.calculatePrice(200, 20, 27);

            expect(result.discountAmount).toBe(40); // 200 * 0.20 = 40
            expect(result.priceAfterDiscount).toBe(160); // 200 - 40 = 160
            expect(result.taxAmount).toBe(43.2); // 160 * 0.27 = 43.2
            expect(result.finalPrice).toBe(203.2); // 160 + 43.2 = 203.2
        });
    });

    describe('calculateCartItemPrice - Items del Carrito', () => {
        test('Item simple con cantidad', () => {
            const result = PriceCalculator.calculateCartItemPrice(25, 4, 8, 21);

            expect(result.basePrice).toBe(25);
            expect(result.quantity).toBe(4);
            expect(result.discountAmount).toBe(2); // 25 * 0.08 = 2
            expect(result.priceAfterDiscount).toBe(23); // 25 - 2 = 23
            expect(result.taxAmount).toBe(4.83); // 23 * 0.21 = 4.83
            expect(result.unitPriceWithTax).toBe(27.83); // 23 + 4.83 = 27.83
            expect(result.subtotalWithTax).toBe(111.32); // 27.83 * 4 = 111.32
        });
    });

    describe('calculateTotals - Totales de Múltiples Items', () => {
        test('Carrito con 2 items diferentes', () => {
            const items = [
                { basePrice: 100, quantity: 1, discountRate: 10, taxRate: 21 },
                { basePrice: 50, quantity: 2, discountRate: 0, taxRate: 10.5 }
            ];

            const result = PriceCalculator.calculateTotals(items);            // Item 1: 100 → 90 (desc) → IVA: 18.9 → final: 108.9 * 1
            // Item 2: 50 → 50 (no desc) → IVA: 5.25 per unit * 2 = 10.5 total → final: 55.25 * 2 = 110.5

            expect(result.items).toHaveLength(2);
            expect(result.totalSubtotal).toBe(190); // 90 + (50*2) = 190
            expect(result.totalDiscountAmount).toBe(10); // 10 + 0 = 10
            expect(result.totalTaxAmount).toBe(29.4); // 18.9 + 10.5 = 29.4
            expect(result.finalTotal).toBe(219.4); // 108.9 + 110.5 = 219.4
        });

        test('Carrito vacío', () => {
            const result = PriceCalculator.calculateTotals([]);

            expect(result.items).toHaveLength(0);
            expect(result.totalSubtotal).toBe(0);
            expect(result.totalDiscountAmount).toBe(0);
            expect(result.totalTaxAmount).toBe(0);
            expect(result.finalTotal).toBe(0);
        });
    });

    describe('Validación de Flujo de Negocio', () => {
        test('Descuento SIEMPRE antes que IVA', () => {
            // Usando valores que SÍ den diferencias por redondeo
            const basePrice = 99.99;
            const discount = 33.33;
            const tax = 27.5;

            const result = PriceCalculator.calculatePrice(basePrice, discount, tax);

            // FLUJO CORRECTO: 99.99 → 66.66 (desc) → 84.99 (final)
            const expectedDiscount = 33.33; // 99.99 * 0.3333 = 33.326667 -> 33.33
            const expectedAfterDiscount = 66.66; // 99.99 - 33.33
            const expectedTax = 18.33; // 66.66 * 0.275 = 18.3315 -> 18.33
            const expectedFinal = 84.99; // 66.66 + 18.33

            expect(result.discountAmount).toBe(expectedDiscount);
            expect(result.priceAfterDiscount).toBe(expectedAfterDiscount);
            expect(result.taxAmount).toBe(expectedTax);
            expect(result.finalPrice).toBe(expectedFinal);

            // VERIFICAR que NO es el flujo incorrecto
            // Incorrecto: 99.99 → 127.49 (IVA) → 85.16 (desc)
            const wrongFinal = Math.round(basePrice * (1 + tax / 100) * (1 - discount / 100) * 100) / 100;
            expect(result.finalPrice).not.toBe(wrongFinal);
        });
    });
});
