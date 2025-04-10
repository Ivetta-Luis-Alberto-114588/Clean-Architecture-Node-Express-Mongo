// src/domain/use-cases/coupon/create-coupon.use-case.ts
import { CreateCouponDto } from "../../dtos/coupon/create-coupon.dto";
import { CouponEntity } from "../../entities/coupon/coupon.entity";
import { CustomError } from "../../errors/custom.error";
import { CouponRepository } from "../../repositories/coupon/coupon.repository";

interface ICreateCouponUseCase {
    execute(dto: CreateCouponDto): Promise<CouponEntity>;
}

export class CreateCouponUseCase implements ICreateCouponUseCase {
    constructor(private readonly couponRepository: CouponRepository) { }

    async execute(dto: CreateCouponDto): Promise<CouponEntity> {
        // Verificar si ya existe un cupón con ese código (aunque la BD también lo hará)
        const existingCoupon = await this.couponRepository.findByCode(dto.code);
        if (existingCoupon) {
            throw CustomError.badRequest(`El código de cupón '${dto.code}' ya existe.`);
        }

        // Crear el cupón
        try {
            const coupon = await this.couponRepository.create(dto);
            return coupon;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al crear el cupón.");
        }
    }
}