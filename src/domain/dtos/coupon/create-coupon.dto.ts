// src/domain/dtos/coupon/create-coupon.dto.ts
import { DiscountType } from "../../entities/coupon/coupon.entity";

export class CreateCouponDto {
    private constructor(
        public code: string,
        public discountType: DiscountType,
        public discountValue: number,
        public description?: string,
        public isActive?: boolean,
        public validFrom?: Date | null,
        public validUntil?: Date | null,
        public minPurchaseAmount?: number | null,
        public usageLimit?: number | null,
    ) { }

    static create(object: { [key: string]: any }): [string?, CreateCouponDto?] {
        const {
            code, discountType, discountValue, description, isActive = true,
            validFrom, validUntil, minPurchaseAmount, usageLimit
        } = object;

        // Validaciones
        if (!code) return ["El código del cupón es requerido", undefined];
        if (code.length < 3) return ["El código debe tener al menos 3 caracteres", undefined];

        if (!discountType) return ["El tipo de descuento es requerido", undefined];
        if (!Object.values(DiscountType).includes(discountType)) {
            return [`El tipo de descuento debe ser '${DiscountType.PERCENTAGE}' o '${DiscountType.FIXED}'`, undefined];
        }

        if (discountValue === undefined) return ["El valor del descuento es requerido", undefined];
        if (typeof discountValue !== 'number' || discountValue <= 0) {
            return ["El valor del descuento debe ser un número positivo", undefined];
        }
        if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
            return ["El descuento porcentual no puede ser mayor a 100", undefined];
        }

        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return ["isActive debe ser booleano", undefined];
        }

        let parsedValidFrom: Date | null = null;
        if (validFrom) {
            parsedValidFrom = new Date(validFrom);
            if (isNaN(parsedValidFrom.getTime())) return ["Fecha 'validFrom' inválida", undefined];
        }

        let parsedValidUntil: Date | null = null;
        if (validUntil) {
            parsedValidUntil = new Date(validUntil);
            if (isNaN(parsedValidUntil.getTime())) return ["Fecha 'validUntil' inválida", undefined];
        }

        if (parsedValidFrom && parsedValidUntil && parsedValidFrom > parsedValidUntil) {
            return ["La fecha 'validFrom' no puede ser posterior a 'validUntil'", undefined];
        }

        if (minPurchaseAmount !== undefined && (typeof minPurchaseAmount !== 'number' || minPurchaseAmount < 0)) {
            return ["El monto mínimo de compra debe ser un número no negativo", undefined];
        }

        if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 0)) {
            return ["El límite de uso debe ser un número entero no negativo", undefined];
        }

        return [
            undefined,
            new CreateCouponDto(
                code.toUpperCase().trim(), // Guardar en mayúsculas y sin espacios
                discountType,
                discountValue,
                description,
                isActive,
                parsedValidFrom,
                parsedValidUntil,
                minPurchaseAmount ?? null, // Convertir undefined a null
                usageLimit ?? null // Convertir undefined a null
            )
        ];
    }
}