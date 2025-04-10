// src/domain/datasources/coupon/coupon.datasource.ts
import { CreateCouponDto } from "../../dtos/coupon/create-coupon.dto";
import { UpdateCouponDto } from "../../dtos/coupon/update-coupon.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CouponEntity } from "../../entities/coupon/coupon.entity";

export abstract class CouponDataSource {

    // --- Métodos principales para la lógica de negocio ---
    abstract findByCode(code: string): Promise<CouponEntity | null>;
    abstract incrementUsage(id: string, session?: any): Promise<void>; // Añadir session opcional

    // --- Métodos CRUD para administración (Opcional) ---
    abstract create(createCouponDto: CreateCouponDto): Promise<CouponEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<CouponEntity[]>;
    abstract findById(id: string): Promise<CouponEntity | null>;
    abstract update(id: string, updateCouponDto: UpdateCouponDto): Promise<CouponEntity | null>;
    abstract delete(id: string): Promise<CouponEntity | null>; // O cambiar a desactivar
}