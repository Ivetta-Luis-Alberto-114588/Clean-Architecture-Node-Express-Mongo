// src/domain/use-cases/coupon/delete-coupon.use-case.ts
import { CouponEntity } from "../../entities/coupon/coupon.entity";
import { CustomError } from "../../errors/custom.error";
import { CouponRepository } from "../../repositories/coupon/coupon.repository";

interface IDeleteCouponUseCase {
    execute(id: string): Promise<CouponEntity>;
}

export class DeleteCouponUseCase implements IDeleteCouponUseCase {
    constructor(private readonly couponRepository: CouponRepository) { }

    async execute(id: string): Promise<CouponEntity> {
        try {
            // Considerar cambiar a desactivar en lugar de borrar:
            // const updatedCoupon = await this.couponRepository.update(id, { isActive: false });
            const deletedCoupon = await this.couponRepository.delete(id);
            if (!deletedCoupon) {
                throw CustomError.notFound(`Cupón con ID ${id} no encontrado.`);
            }
            return deletedCoupon;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al eliminar el cupón.");
        }
    }
}