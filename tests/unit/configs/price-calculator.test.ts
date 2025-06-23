// tests/unit/configs/price-calculator.test.ts
import { PriceCalculator } from '../../../src/configs/price-calculator';

describe('PriceCalculator', () => {
    describe('calculatePrice', () => {
        test('should calculate price with correct flow: discount first, then tax', () => {
            // Precio $100, descuento 10%, IVA 21%
            const result = PriceCalculator.calculatePrice(100, 10, 21);

            expect(result.basePrice).toBe(100);
            expect(result.discountRate).toBe(10);
            expect(result.discountAmount).toBe(10); // 100 * 0.10
            expect(result.priceAfterDiscount).toBe(90); // 100 - 10
            expect(result.taxRate).toBe(21);
            expect(result.taxAmount).toBe(18.90); // 90 * 0.21
            expect(result.finalPrice).toBe(108.90); // 90 + 18.90
        });

        test('should work with no discount', () => {
            const result = PriceCalculator.calculatePrice(100, 0, 21);

            expect(result.discountAmount).toBe(0);
            expect(result.priceAfterDiscount).toBe(100);
            expect(result.taxAmount).toBe(21);
            expect(result.finalPrice).toBe(121);
        });

        test('should work with no tax', () => {
            const result = PriceCalculator.calculatePrice(100, 10, 0);

            expect(result.discountAmount).toBe(10);
            expect(result.priceAfterDiscount).toBe(90);
            expect(result.taxAmount).toBe(0);
            expect(result.finalPrice).toBe(90);
        });

        test('should handle decimal calculations correctly', () => {
            const result = PriceCalculator.calculatePrice(99.99, 15, 21);

            expect(result.discountAmount).toBe(15.00); // 99.99 * 0.15 = 14.9985 -> 15.00
            expect(result.priceAfterDiscount).toBe(84.99); // 99.99 - 15.00
            expect(result.taxAmount).toBe(17.85); // 84.99 * 0.21 = 17.8479 -> 17.85
            expect(result.finalPrice).toBe(102.84); // 84.99 + 17.85
        });
    });

    describe('calculateCartItemPrice', () => {
        test('should calculate cart item price correctly', () => {
            const result = PriceCalculator.calculateCartItemPrice(100, 2, 10, 21);

            expect(result.quantity).toBe(2);
            expect(result.unitPriceWithTax).toBe(108.90); // precio final por unidad
            expect(result.subtotalWithTax).toBe(217.80); // 108.90 * 2
        });
    });

    describe('calculateTotals', () => {
        test('should calculate totals for multiple items', () => {
            const items = [
                { basePrice: 100, quantity: 1, discountRate: 10, taxRate: 21 },
                { basePrice: 50, quantity: 2, discountRate: 0, taxRate: 21 }
            ];

            const result = PriceCalculator.calculateTotals(items);

            // Item 1: 100 -> 90 (desc) -> 108.90 (tax)
            // Item 2: 50 -> 50 (no desc) -> 60.50 (tax) * 2 = 121
            expect(result.totalSubtotal).toBe(190); // 90 + (50*2)
            expect(result.totalTaxAmount).toBe(39.90); // 18.90 + 21
            expect(result.totalDiscountAmount).toBe(10); // 10 + 0
            expect(result.finalTotal).toBe(229.90); // 108.90 + 121
        });
    });
});
