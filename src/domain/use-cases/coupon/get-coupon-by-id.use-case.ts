// src/domain/use-cases/coupon/get-coupon-by-id.use-case.ts
import { CouponEntity } from "../../entities/coupon/coupon.entity";
import { CustomError } from "../../errors/custom.error";
import { CouponRepository } from "../../repositories/coupon/coupon.repository";

interface IGetCouponByIdUseCase {
    execute(id: string): Promise<CouponEntity>;
}

export class GetCouponByIdUseCase implements IGetCouponByIdUseCase {
    constructor(private readonly couponRepository: CouponRepository) { }

    async execute(id: string): Promise<CouponEntity> {
        try {
            const coupon = await this.couponRepository.findById(id);
            if (!coupon) {
                throw CustomError.notFound(`Cupón con ID ${id} no encontrado.`);
            }
            return coupon;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al obtener el cupón por ID.");
        }
    }
}