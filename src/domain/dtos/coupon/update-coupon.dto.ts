// src/domain/dtos/coupon/update-coupon.dto.ts
import { DiscountType } from "../../entities/coupon/coupon.entity";

export class UpdateCouponDto {
    private constructor(
        public code?: string,
        public discountType?: DiscountType,
        public discountValue?: number,
        public description?: string | null, // Permitir null para borrar
        public isActive?: boolean,
        public validFrom?: Date | null, // Permitir null para borrar
        public validUntil?: Date | null, // Permitir null para borrar
        public minPurchaseAmount?: number | null, // Permitir null para borrar
        public usageLimit?: number | null, // Permitir null para borrar
    ) { }

    static update(object: { [key: string]: any }): [string?, UpdateCouponDto?] {
        const {
            code, discountType, discountValue, description, isActive,
            validFrom, validUntil, minPurchaseAmount, usageLimit
        } = object;

        // Validar que al menos un campo venga
        if (Object.keys(object).length === 0) {
            return ["Debe proporcionar al menos un campo para actualizar", undefined];
        }

        const updateData: any = {};

        // Validaciones individuales si el campo está presente
        if (code !== undefined) {
            if (code.length < 3) return ["El código debe tener al menos 3 caracteres", undefined];
            updateData.code = code.toUpperCase().trim();
        }

        if (discountType !== undefined) {
            if (!Object.values(DiscountType).includes(discountType)) {
                return [`El tipo de descuento debe ser '${DiscountType.PERCENTAGE}' o '${DiscountType.FIXED}'`, undefined];
            }
            updateData.discountType = discountType;
        }

        if (discountValue !== undefined) {
            if (typeof discountValue !== 'number' || discountValue <= 0) {
                return ["El valor del descuento debe ser un número positivo", undefined];
            }
            // Revalidar porcentaje si el tipo también cambia o ya existe
            if ((updateData.discountType || object.existingDiscountType) === DiscountType.PERCENTAGE && discountValue > 100) {
                return ["El descuento porcentual no puede ser mayor a 100", undefined];
            }
            updateData.discountValue = discountValue;
        }

        if (description !== undefined) { // Permite string vacío o null
            updateData.description = description;
        }

        if (isActive !== undefined) {
            if (typeof isActive !== 'boolean') return ["isActive debe ser booleano", undefined];
            updateData.isActive = isActive;
        }

        if (validFrom !== undefined) {
            if (validFrom === null) {
                updateData.validFrom = null;
            } else {
                const parsedDate = new Date(validFrom);
                if (isNaN(parsedDate.getTime())) return ["Fecha 'validFrom' inválida", undefined];
                updateData.validFrom = parsedDate;
            }
        }

        if (validUntil !== undefined) {
            if (validUntil === null) {
                updateData.validUntil = null;
            } else {
                const parsedDate = new Date(validUntil);
                if (isNaN(parsedDate.getTime())) return ["Fecha 'validUntil' inválida", undefined];
                updateData.validUntil = parsedDate;
            }
        }

        // Validar fechas si ambas están presentes (nuevas o existentes)
        const finalValidFrom = updateData.validFrom ?? object.existingValidFrom;
        const finalValidUntil = updateData.validUntil ?? object.existingValidUntil;
        if (finalValidFrom && finalValidUntil && finalValidFrom > finalValidUntil) {
            return ["La fecha 'validFrom' no puede ser posterior a 'validUntil'", undefined];
        }

        if (minPurchaseAmount !== undefined) {
            if (minPurchaseAmount === null) {
                updateData.minPurchaseAmount = null;
            } else if (typeof minPurchaseAmount !== 'number' || minPurchaseAmount < 0) {
                return ["El monto mínimo de compra debe ser un número no negativo", undefined];
            } else {
                updateData.minPurchaseAmount = minPurchaseAmount;
            }
        }

        if (usageLimit !== undefined) {
            if (usageLimit === null) {
                updateData.usageLimit = null;
            } else if (!Number.isInteger(usageLimit) || usageLimit < 0) {
                return ["El límite de uso debe ser un número entero no negativo", undefined];
            } else {
                updateData.usageLimit = usageLimit;
            }
        }

        return [
            undefined,
            new UpdateCouponDto(
                updateData.code,
                updateData.discountType,
                updateData.discountValue,
                updateData.description,
                updateData.isActive,
                updateData.validFrom,
                updateData.validUntil,
                updateData.minPurchaseAmount,
                updateData.usageLimit
            )
        ];
    }
}