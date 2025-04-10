// src/domain/use-cases/coupon/get-all-coupons.use-case.ts
import { PaginationDto } from "../../dtos/shared/pagination.dto";
import { CouponEntity } from "../../entities/coupon/coupon.entity";
import { CustomError } from "../../errors/custom.error";
import { CouponRepository } from "../../repositories/coupon/coupon.repository";

interface IGetAllCouponsUseCase {
    execute(paginationDto: PaginationDto): Promise<CouponEntity[]>;
}

export class GetAllCouponsUseCase implements IGetAllCouponsUseCase {
    constructor(private readonly couponRepository: CouponRepository) { }

    async execute(paginationDto: PaginationDto): Promise<CouponEntity[]> {
        try {
            const coupons = await this.couponRepository.getAll(paginationDto);
            return coupons;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al obtener los cupones.");
        }
    }
}