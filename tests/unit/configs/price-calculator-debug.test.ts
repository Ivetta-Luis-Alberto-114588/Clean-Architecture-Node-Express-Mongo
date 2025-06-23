// Debug simple para entender los cálculos
import { PriceCalculator } from '../../../src/configs/price-calculator';

describe('Debug PriceCalculator', () => {
    test('Debug caso específico que falla', () => {
        console.log('\n=== DEBUG: Caso del test que falla ===');

        // Caso 1: Item 1 - Precio 100, descuento 10%, IVA 21%
        const item1 = PriceCalculator.calculatePrice(100, 10, 21);
        console.log('Item 1 (100, 10%, 21%):');
        console.log(`  - Base: ${item1.basePrice}`);
        console.log(`  - Descuento: ${item1.discountAmount}`);
        console.log(`  - Después descuento: ${item1.priceAfterDiscount}`);
        console.log(`  - IVA: ${item1.taxAmount}`);
        console.log(`  - Final: ${item1.finalPrice}`);

        // Caso 2: Item 2 - Precio 50, sin descuento, IVA 4.5%
        const item2 = PriceCalculator.calculatePrice(50, 0, 4.5);
        console.log('\nItem 2 (50, 0%, 4.5%):');
        console.log(`  - Base: ${item2.basePrice}`);
        console.log(`  - Descuento: ${item2.discountAmount}`);
        console.log(`  - Después descuento: ${item2.priceAfterDiscount}`);
        console.log(`  - IVA: ${item2.taxAmount}`);
        console.log(`  - Final: ${item2.finalPrice}`);

        // Cálculo de totales manualmente
        console.log('\n=== CÁLCULO MANUAL ===');
        const manualSubtotal = item1.priceAfterDiscount + (item2.priceAfterDiscount * 2);
        const manualTaxTotal = item1.taxAmount + (item2.taxAmount * 2);
        const manualDiscountTotal = item1.discountAmount + (item2.discountAmount * 2);
        const manualFinalTotal = item1.finalPrice + (item2.finalPrice * 2);

        console.log(`Subtotal manual: ${item1.priceAfterDiscount} + (${item2.priceAfterDiscount} * 2) = ${manualSubtotal}`);
        console.log(`Tax manual: ${item1.taxAmount} + (${item2.taxAmount} * 2) = ${manualTaxTotal}`);
        console.log(`Discount manual: ${item1.discountAmount} + (${item2.discountAmount} * 2) = ${manualDiscountTotal}`);
        console.log(`Final manual: ${item1.finalPrice} + (${item2.finalPrice} * 2) = ${manualFinalTotal}`);

        // Usando calculateTotals
        console.log('\n=== USANDO calculateTotals ===');
        const items = [
            { basePrice: 100, quantity: 1, discountRate: 10, taxRate: 21 },
            { basePrice: 50, quantity: 2, discountRate: 0, taxRate: 4.5 }
        ];

        const result = PriceCalculator.calculateTotals(items);
        console.log('Resultado calculateTotals:');
        console.log(`  - totalSubtotal: ${result.totalSubtotal}`);
        console.log(`  - totalTaxAmount: ${result.totalTaxAmount}`);
        console.log(`  - totalDiscountAmount: ${result.totalDiscountAmount}`);
        console.log(`  - finalTotal: ${result.finalTotal}`);

        // Comparación
        console.log('\n=== COMPARACIÓN ===');
        console.log(`Subtotal: manual=${manualSubtotal}, auto=${result.totalSubtotal}, ¿igual? ${manualSubtotal === result.totalSubtotal}`);
        console.log(`Tax: manual=${manualTaxTotal}, auto=${result.totalTaxAmount}, ¿igual? ${manualTaxTotal === result.totalTaxAmount}`);
        console.log(`Discount: manual=${manualDiscountTotal}, auto=${result.totalDiscountAmount}, ¿igual? ${manualDiscountTotal === result.totalDiscountAmount}`);
        console.log(`Final: manual=${manualFinalTotal}, auto=${result.finalTotal}, ¿igual? ${manualFinalTotal === result.finalTotal}`);
    });

    test('Debug flujo de negocio', () => {
        console.log('\n=== DEBUG: Flujo de negocio ===');

        const basePrice = 95;
        const discount = 15;
        const tax = 21;

        // Flujo correcto: descuento primero
        const correct = PriceCalculator.calculatePrice(basePrice, discount, tax);
        console.log(`Flujo correcto (${basePrice}, ${discount}%, ${tax}%):`);
        console.log(`  ${basePrice} -> -${correct.discountAmount} = ${correct.priceAfterDiscount} -> +${correct.taxAmount} = ${correct.finalPrice}`);

        // Flujo incorrecto: IVA primero
        const wrongTax = Math.round(basePrice * (tax / 100) * 100) / 100;
        const wrongAfterTax = Math.round((basePrice + wrongTax) * 100) / 100;
        const wrongDiscount = Math.round(wrongAfterTax * (discount / 100) * 100) / 100;
        const wrongFinal = Math.round((wrongAfterTax - wrongDiscount) * 100) / 100;

        console.log(`Flujo incorrecto (${basePrice}, ${discount}%, ${tax}%):`);
        console.log(`  ${basePrice} -> +${wrongTax} = ${wrongAfterTax} -> -${wrongDiscount} = ${wrongFinal}`);

        console.log(`\nComparación final: correcto=${correct.finalPrice}, incorrecto=${wrongFinal}`);
        console.log(`¿Son diferentes? ${correct.finalPrice !== wrongFinal ? 'SÍ' : 'NO'}`);

        // También probemos el método directo
        const wrongDirectly = basePrice * (1 + tax / 100) * (1 - discount / 100);
        const wrongRounded = Math.round(wrongDirectly * 100) / 100;
        console.log(`Método directo incorrecto: ${wrongDirectly} -> redondeado: ${wrongRounded}`);
    });
});
