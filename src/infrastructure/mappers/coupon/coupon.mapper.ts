// src/infrastructure/mappers/coupon/coupon.mapper.ts
import { CouponEntity, DiscountType } from "../../../domain/entities/coupon/coupon.entity";
import { CustomError } from "../../../domain/errors/custom.error";

export class CouponMapper {

    static fromObjectToCouponEntity(object: { [key: string]: any }): CouponEntity {
        const {
            _id, id, code, discountType, discountValue, description, isActive,
            validFrom, validUntil, minPurchaseAmount, usageLimit, timesUsed,
            createdAt, updatedAt
        } = object;

        if (!_id && !id) throw CustomError.badRequest('CouponMapper: missing id');
        if (!code) throw CustomError.badRequest('CouponMapper: missing code');
        if (!discountType) throw CustomError.badRequest('CouponMapper: missing discountType');
        if (discountValue === undefined) throw CustomError.badRequest('CouponMapper: missing discountValue');

        // Validar que discountType sea uno de los valores del enum
        if (!Object.values(DiscountType).includes(discountType)) {
            throw CustomError.badRequest(`CouponMapper: invalid discountType: ${discountType}`);
        }

        return new CouponEntity(
            _id?.toString() || id?.toString(),
            code,
            discountType as DiscountType, // Castear a enum
            Number(discountValue),
            description,
            isActive ?? true, // Default a true si no viene
            validFrom ? new Date(validFrom) : null,
            validUntil ? new Date(validUntil) : null,
            minPurchaseAmount ?? null, // Convertir undefined/null a null
            usageLimit ?? null, // Convertir undefined/null a null
            timesUsed ?? 0, // Default a 0 si no viene
            createdAt ? new Date(createdAt) : undefined,
            updatedAt ? new Date(updatedAt) : undefined
        );
    }
}