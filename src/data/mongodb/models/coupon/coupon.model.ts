// src/data/mongodb/models/coupon/coupon.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { DiscountType } from "../../../../domain/entities/coupon/coupon.entity"; // Importar enum

// --- Interfaz ICoupon ---
export interface ICoupon extends Document {
    code: string;               // Código único del cupón (ej: VERANO20)
    discountType: DiscountType; // Tipo de descuento ('percentage' o 'fixed')
    discountValue: number;      // Valor del descuento (ej: 20 para 20%, 10 para $10)
    description?: string;       // Descripción opcional
    isActive: boolean;          // Indica si el cupón está activo
    validFrom?: Date | null;    // Fecha desde la que es válido (opcional, null si no aplica)
    validUntil?: Date | null;   // Fecha hasta la que es válido (opcional, null si no aplica)
    minPurchaseAmount?: number | null; // Monto mínimo de compra para aplicar (opcional, null si no aplica)
    usageLimit?: number | null; // Límite máximo de usos totales (opcional, null si no hay límite)
    timesUsed: number;          // Contador de veces que se ha usado el cupón
    // createdAt y updatedAt son añadidos automáticamente por timestamps: true
}
// --- Fin Interfaz ICoupon ---

// El resto del archivo (Schema, pre-hook, Model export) sigue debajo...

const couponSchema = new Schema<ICoupon>({
    code: {
        type: String,
        required: [true, "Coupon code is required"],
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    discountType: {
        type: String,
        enum: Object.values(DiscountType),
        required: [true, "Discount type is required"],
    },
    discountValue: {
        type: Number,
        required: [true, "Discount value is required"],
        min: [0, "Discount value cannot be negative"],
    },
    description: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    validFrom: {
        type: Date,
        default: null,
    },
    validUntil: {
        type: Date,
        default: null,
    },
    minPurchaseAmount: {
        type: Number,
        default: null,
        min: [0, "Minimum purchase amount cannot be negative"],
    },
    usageLimit: {
        type: Number,
        default: null,
        min: [0, "Usage limit cannot be negative"],
        validate: {
            validator: (v: number | null) => v === null || Number.isInteger(v),
            message: 'Usage limit must be an integer or null.'
        }
    },
    timesUsed: {
        type: Number,
        default: 0,
        min: [0, "Times used cannot be negative"],
    },
}, {
    timestamps: true
});

couponSchema.pre<ICoupon>('save', function (next) {
    if (this.discountType === DiscountType.PERCENTAGE && this.discountValue > 100) {
        return next(new Error('Percentage discount cannot exceed 100.'));
    }
    if (this.validFrom && this.validUntil && this.validFrom > this.validUntil) {
        return next(new Error('validFrom date cannot be after validUntil date.'));
    }
    next();
});

export const CouponModel = mongoose.model<ICoupon>("Coupon", couponSchema);