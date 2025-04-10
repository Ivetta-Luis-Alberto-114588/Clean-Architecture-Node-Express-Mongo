// src/presentation/coupon/controller.coupon.ts
import { Request, Response } from "express";
import { CustomError } from "../../domain/errors/custom.error";
import { CouponRepository } from "../../domain/repositories/coupon/coupon.repository";
import { CreateCouponDto } from "../../domain/dtos/coupon/create-coupon.dto";
import { UpdateCouponDto } from "../../domain/dtos/coupon/update-coupon.dto";
import { PaginationDto } from "../../domain/dtos/shared/pagination.dto";
import { CreateCouponUseCase } from "../../domain/use-cases/coupon/create-coupon.use-case";
import { GetAllCouponsUseCase } from "../../domain/use-cases/coupon/get-all-coupons.use-case";
import { GetCouponByIdUseCase } from "../../domain/use-cases/coupon/get-coupon-by-id.use-case";
import { UpdateCouponUseCase } from "../../domain/use-cases/coupon/update-coupon.use-case";
import { DeleteCouponUseCase } from "../../domain/use-cases/coupon/delete-coupon.use-case";
import logger from "../../configs/logger";

export class CouponController {

    constructor(private readonly couponRepository: CouponRepository) { }

    private handleError = (error: unknown, res: Response, reqId?: string) => {
        const errorData = { error: 'Error interno del servidor', message: '', requestId: reqId };
        let statusCode = 500;

        if (error instanceof CustomError) {
            statusCode = error.statusCode;
            errorData.error = error.message;
        } else if (error instanceof Error) {
            errorData.message = error.message;
        }

        logger.error(`Error en CouponController (ReqID: ${reqId || 'N/A'})`, {
            statusCode,
            errorMessage: errorData.error,
            originalError: error instanceof Error ? { message: error.message, stack: error.stack } : error,
            requestId: reqId
        });

        return res.status(statusCode).json(errorData);
    }

    createCoupon = (req: Request, res: Response) => {
        const [error, createCouponDto] = CreateCouponDto.create(req.body);
        if (error) return res.status(400).json({ error });

        new CreateCouponUseCase(this.couponRepository)
            .execute(createCouponDto!)
            .then(coupon => res.status(201).json(coupon))
            .catch(err => this.handleError(err, res, req.id));
    }

    getAllCoupons = (req: Request, res: Response) => {
        const { page = 1, limit = 10 } = req.query;
        const [error, paginationDto] = PaginationDto.create(+page, +limit);
        if (error) return res.status(400).json({ error });

        new GetAllCouponsUseCase(this.couponRepository)
            .execute(paginationDto!)
            .then(coupons => res.json(coupons))
            .catch(err => this.handleError(err, res, req.id));
    }

    getCouponById = (req: Request, res: Response) => {
        const { id } = req.params;
        new GetCouponByIdUseCase(this.couponRepository)
            .execute(id)
            .then(coupon => res.json(coupon))
            .catch(err => this.handleError(err, res, req.id));
    }

    updateCoupon = (req: Request, res: Response) => {
        const { id } = req.params;
        // Pasamos el cupón existente al DTO para validaciones cruzadas
        this.couponRepository.findById(id).then(existingCoupon => {
            if (!existingCoupon) throw CustomError.notFound(`Cupón con ID ${id} no encontrado.`);

            const [error, updateCouponDto] = UpdateCouponDto.update({
                ...req.body,
                existingDiscountType: existingCoupon.discountType, // Pasar tipo existente
                existingValidFrom: existingCoupon.validFrom,
                existingValidUntil: existingCoupon.validUntil,
            });
            if (error) return res.status(400).json({ error });

            new UpdateCouponUseCase(this.couponRepository)
                .execute(id, updateCouponDto!)
                .then(coupon => res.json(coupon))
                .catch(err => this.handleError(err, res, req.id));

        }).catch(err => this.handleError(err, res, req.id)); // Capturar error de findById
    }

    deleteCoupon = (req: Request, res: Response) => {
        const { id } = req.params;
        new DeleteCouponUseCase(this.couponRepository)
            .execute(id)
            .then(coupon => res.json({ message: 'Cupón eliminado (o desactivado)', coupon }))
            .catch(err => this.handleError(err, res, req.id));
    }
}