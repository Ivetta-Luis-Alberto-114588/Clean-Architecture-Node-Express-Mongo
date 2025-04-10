// src/domain/repositories/coupon/coupon.repository.ts
import { CreateCouponDto } from "../../dtos/coupon/create-coupon.dto";
import { UpdateCouponDto } from "../../dtos/coupon/update-coupon.dto";
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CouponEntity } from "../../entities/coupon/coupon.entity";

// La interfaz del repositorio suele ser idéntica a la del Datasource
export abstract class CouponRepository {

    abstract findByCode(code: string): Promise<CouponEntity | null>;
    abstract incrementUsage(id: string, session?: any): Promise<void>; // Añadir session opcional

    abstract create(createCouponDto: CreateCouponDto): Promise<CouponEntity>;
    abstract getAll(paginationDto: PaginationDto): Promise<CouponEntity[]>;
    abstract findById(id: string): Promise<CouponEntity | null>;
    abstract update(id: string, updateCouponDto: UpdateCouponDto): Promise<CouponEntity | null>;
    abstract delete(id: string): Promise<CouponEntity | null>;
}