// src/domain/entities/coupon/coupon.entity.ts
export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed'
}

export class CouponEntity {
    constructor(
        public id: string,
        public code: string, // Código único del cupón (ej: VERANO20)
        public discountType: DiscountType, // 'percentage' o 'fixed'
        public discountValue: number, // El valor (20 para 20%, 10 para $10)
        public description?: string, // Descripción opcional
        public isActive?: boolean, // Si el cupón está activo
        public validFrom?: Date | null, // Fecha desde la que es válido (opcional)
        public validUntil?: Date | null, // Fecha hasta la que es válido (opcional)
        public minPurchaseAmount?: number | null, // Monto mínimo de compra (opcional)
        public usageLimit?: number | null, // Límite máximo de usos totales (opcional)
        public timesUsed?: number, // Veces que se ha usado
        public createdAt?: Date,
        public updatedAt?: Date,
    ) { }

    // Método de ayuda para verificar si el cupón está actualmente válido (activo y dentro del rango de fechas)
    get isValidNow(): boolean {
        const now = new Date();
        if (!this.isActive) return false;
        if (this.validFrom && now < this.validFrom) return false;
        if (this.validUntil && now > this.validUntil) return false;
        return true;
    }

    // Método de ayuda para verificar si se ha alcanzado el límite de uso
    get isUsageLimitReached(): boolean {
        if (this.usageLimit === null || this.usageLimit === undefined) return false; // Sin límite
        return (this.timesUsed ?? 0) >= this.usageLimit;
    }
}