// src/infrastructure/repositories/coupon/coupon.repository.impl.ts
import { CouponDataSource } from "../../../domain/datasources/coupon/coupon.datasource";
import { CreateCouponDto } from "../../../domain/dtos/coupon/create-coupon.dto";
import { UpdateCouponDto } from "../../../domain/dtos/coupon/update-coupon.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CouponEntity } from "../../../domain/entities/coupon/coupon.entity";
import { CouponRepository } from "../../../domain/repositories/coupon/coupon.repository";

export class CouponRepositoryImpl implements CouponRepository {

    constructor(
        private readonly couponDataSource: CouponDataSource
    ) { }

    findByCode(code: string): Promise<CouponEntity | null> {
        return this.couponDataSource.findByCode(code);
    }

    incrementUsage(id: string, session?: any): Promise<void> {
        return this.couponDataSource.incrementUsage(id, session);
    }

    create(createCouponDto: CreateCouponDto): Promise<CouponEntity> {
        return this.couponDataSource.create(createCouponDto);
    }

    getAll(paginationDto: PaginationDto): Promise<CouponEntity[]> {
        return this.couponDataSource.getAll(paginationDto);
    }

    findById(id: string): Promise<CouponEntity | null> {
        return this.couponDataSource.findById(id);
    }

    update(id: string, updateCouponDto: UpdateCouponDto): Promise<CouponEntity | null> {
        return this.couponDataSource.update(id, updateCouponDto);
    }

    delete(id: string): Promise<CouponEntity | null> {
        return this.couponDataSource.delete(id);
    }
}