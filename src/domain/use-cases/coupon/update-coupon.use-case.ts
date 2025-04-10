// src/domain/use-cases/coupon/update-coupon.use-case.ts
import { UpdateCouponDto } from "../../dtos/coupon/update-coupon.dto";
import { CouponEntity } from "../../entities/coupon/coupon.entity";
import { CustomError } from "../../errors/custom.error";
import { CouponRepository } from "../../repositories/coupon/coupon.repository";

interface IUpdateCouponUseCase {
    execute(id: string, dto: UpdateCouponDto): Promise<CouponEntity>;
}

export class UpdateCouponUseCase implements IUpdateCouponUseCase {
    constructor(private readonly couponRepository: CouponRepository) { }

    async execute(id: string, dto: UpdateCouponDto): Promise<CouponEntity> {
        // Verificar si el cupón existe
        const existingCoupon = await this.couponRepository.findById(id);
        if (!existingCoupon) {
            throw CustomError.notFound(`Cupón con ID ${id} no encontrado.`);
        }

        // Si se intenta cambiar el código, verificar que el nuevo no exista
        if (dto.code && dto.code.toUpperCase() !== existingCoupon.code) {
            const anotherCouponWithCode = await this.couponRepository.findByCode(dto.code);
            if (anotherCouponWithCode && anotherCouponWithCode.id !== id) {
                throw CustomError.badRequest(`El código de cupón '${dto.code}' ya está en uso.`);
            }
        }

        // Actualizar el cupón
        try {
            // Pasar datos existentes al DTO para validación cruzada (ej: % > 100)
            const [validationError, validDto] = UpdateCouponDto.update({
                ...dto,
                existingDiscountType: existingCoupon.discountType,
                existingValidFrom: existingCoupon.validFrom,
                existingValidUntil: existingCoupon.validUntil,
            });
            if (validationError) throw CustomError.badRequest(validationError);


            const updatedCoupon = await this.couponRepository.update(id, validDto!);
            if (!updatedCoupon) { // Doble chequeo por si acaso
                throw CustomError.notFound(`Cupón con ID ${id} no encontrado durante la actualización.`);
            }
            return updatedCoupon;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al actualizar el cupón.");
        }
    }
}