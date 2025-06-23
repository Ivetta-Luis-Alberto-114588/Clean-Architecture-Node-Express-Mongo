// tests/smoke/price-calculator.smoke.test.ts

import { PriceCalculator } from '../../src/configs/price-calculator';

describe('PriceCalculator Smoke Tests', () => {
    describe('Basic Price Calculations', () => {

        it('should calculate single item price without discount correctly', () => {
            // Arrange
            const basePrice = 100;
            const discountRate = 0;
            const taxRate = 21;

            // Act
            const result = PriceCalculator.calculateSingleItemPrice(basePrice, discountRate, taxRate);

            // Assert
            expect(result.basePrice).toBe(100);
            expect(result.discountAmount).toBe(0);
            expect(result.priceAfterDiscount).toBe(100);
            expect(result.taxAmount).toBe(21);
            expect(result.finalPrice).toBe(121);
        });

        it('should calculate single item price with discount correctly', () => {
            // Arrange
            const basePrice = 100;
            const discountRate = 10; // 10%
            const taxRate = 21;

            // Act
            const result = PriceCalculator.calculateSingleItemPrice(basePrice, discountRate, taxRate);

            // Assert
            expect(result.basePrice).toBe(100);
            expect(result.discountAmount).toBe(10); // 10% de 100
            expect(result.priceAfterDiscount).toBe(90); // 100 - 10
            expect(result.taxAmount).toBe(18.9); // 21% de 90
            expect(result.finalPrice).toBe(108.9); // 90 + 18.9
        });

        it('should calculate cart item price with quantity correctly', () => {
            // Arrange
            const basePrice = 50;
            const quantity = 3;
            const discountRate = 0;
            const taxRate = 21;

            // Act
            const result = PriceCalculator.calculateCartItemPrice(basePrice, quantity, discountRate, taxRate);

            // Assert
            expect(result.basePrice).toBe(50);
            expect(result.quantity).toBe(3);
            expect(result.unitPriceWithTax).toBe(60.5); // 50 + 21% = 60.5
            expect(result.subtotalWithTax).toBe(181.5); // 60.5 * 3
        });

        it('should calculate totals for multiple items correctly', () => {
            // Arrange
            const items = [
                { basePrice: 100, quantity: 1, taxRate: 21 },
                { basePrice: 50, quantity: 2, taxRate: 21 }
            ];

            // Act
            const result = PriceCalculator.calculateTotals(items);

            // Assert
            expect(result.items).toHaveLength(2);
            expect(result.totalSubtotal).toBe(200); // 100 + (50*2) = 200
            expect(result.totalTaxAmount).toBe(42); // 21 + (10.5*2) = 42
            expect(result.finalTotal).toBe(242); // 121 + (60.5*2) = 242
        });

        it('should handle edge case with zero price', () => {
            // Arrange
            const basePrice = 0;
            const discountRate = 10;
            const taxRate = 21;

            // Act
            const result = PriceCalculator.calculateSingleItemPrice(basePrice, discountRate, taxRate);

            // Assert
            expect(result.basePrice).toBe(0);
            expect(result.discountAmount).toBe(0);
            expect(result.priceAfterDiscount).toBe(0);
            expect(result.taxAmount).toBe(0);
            expect(result.finalPrice).toBe(0);
        });

        it('should throw error for negative price', () => {
            // Arrange & Act & Assert
            expect(() => {
                PriceCalculator.calculateSingleItemPrice(-10, 0, 21);
            }).toThrow('Base price cannot be negative');
        });

        it('should throw error for invalid quantity', () => {
            // Arrange & Act & Assert
            expect(() => {
                PriceCalculator.calculateCartItemPrice(100, 0, 0, 21);
            }).toThrow('Quantity must be greater than 0');
        });
    });
});
