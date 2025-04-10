// src/infrastructure/datasources/coupon/coupon.mongo.datasource.impl.ts
import mongoose from "mongoose";
import { CouponModel, ICoupon } from "../../../data/mongodb/models/coupon/coupon.model";
import { CouponDataSource } from "../../../domain/datasources/coupon/coupon.datasource";
import { CreateCouponDto } from "../../../domain/dtos/coupon/create-coupon.dto";
import { UpdateCouponDto } from "../../../domain/dtos/coupon/update-coupon.dto";
import { PaginationDto } from "../../../domain/dtos/shared/pagination.dto";
import { CouponEntity } from "../../../domain/entities/coupon/coupon.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { CouponMapper } from "../../mappers/coupon/coupon.mapper";
import logger from "../../../configs/logger";

export class CouponMongoDataSourceImpl implements CouponDataSource {

    async findByCode(code: string): Promise<CouponEntity | null> {
        try {
            const coupon = await CouponModel.findOne({ code: code.toUpperCase() });
            if (!coupon) return null;
            return CouponMapper.fromObjectToCouponEntity(coupon);
        } catch (error) {
            logger.error(`Error finding coupon by code ${code}:`, { error });
            throw CustomError.internalServerError("Error al buscar cupón por código.");
        }
    }

    async incrementUsage(id: string, session?: mongoose.ClientSession): Promise<void> {
        try {
            const updateResult = await CouponModel.findByIdAndUpdate(
                id,
                { $inc: { timesUsed: 1 } },
                { new: true, session } // Pasar la sesión si existe
            );
            if (!updateResult) {
                // Podría ser que el cupón se eliminó justo antes, o ID inválido
                logger.warn(`Intento de incrementar uso de cupón no encontrado: ${id}`);
                // Decidir si lanzar error o no. Si es parte de una transacción mayor,
                // el fallo en encontrarlo podría ser un problema.
                throw CustomError.notFound(`Cupón con ID ${id} no encontrado para incrementar uso.`);
            }
            logger.info(`Uso incrementado para cupón ID: ${id}`);
        } catch (error) {
            logger.error(`Error incrementando uso para cupón ${id}:`, { error });
            if (error instanceof CustomError) throw error;
            throw CustomError.internalServerError("Error al incrementar el uso del cupón.");
        }
    }

    // --- Métodos CRUD para Administración ---

    async create(createCouponDto: CreateCouponDto): Promise<CouponEntity> {
        try {
            const coupon = await CouponModel.create({
                ...createCouponDto,
                code: createCouponDto.code.toUpperCase() // Asegurar mayúsculas
            });
            logger.info(`Cupón creado: ${coupon.code} (ID: ${coupon._id})`);
            return CouponMapper.fromObjectToCouponEntity(coupon);
        } catch (error: any) {
            logger.error("Error creando cupón:", { error, dto: createCouponDto });
            if (error.code === 11000) { // Error de duplicado
                throw CustomError.badRequest(`El código de cupón '${createCouponDto.code}' ya existe.`);
            }
            if (error instanceof mongoose.Error.ValidationError) {
                throw CustomError.badRequest(`Error de validación: ${error.message}`);
            }
            throw CustomError.internalServerError("Error al crear el cupón.");
        }
    }

    async getAll(paginationDto: PaginationDto): Promise<CouponEntity[]> {
        const { page, limit } = paginationDto;
        try {
            const coupons = await CouponModel.find()
                .limit(limit)
                .skip((page - 1) * limit)
                .sort({ createdAt: -1 }); // Ordenar por más reciente

            return coupons.map(CouponMapper.fromObjectToCouponEntity);
        } catch (error) {
            logger.error("Error obteniendo todos los cupones:", { error });
            throw CustomError.internalServerError("Error al obtener los cupones.");
        }
    }

    async findById(id: string): Promise<CouponEntity | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return null; // ID inválido
            const coupon = await CouponModel.findById(id);
            if (!coupon) return null;
            return CouponMapper.fromObjectToCouponEntity(coupon);
        } catch (error) {
            logger.error(`Error buscando cupón por ID ${id}:`, { error });
            throw CustomError.internalServerError("Error al buscar cupón por ID.");
        }
    }

    async update(id: string, updateCouponDto: UpdateCouponDto): Promise<CouponEntity | null> {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return null;

            // Construcción explícita de updateData
            const updateFields: Partial<ICoupon> = {}; // Usar la interfaz del modelo si la tienes
            if (updateCouponDto.code !== undefined) updateFields.code = updateCouponDto.code.toUpperCase();
            if (updateCouponDto.discountType !== undefined) updateFields.discountType = updateCouponDto.discountType;
            if (updateCouponDto.discountValue !== undefined) updateFields.discountValue = updateCouponDto.discountValue;
            if (updateCouponDto.description !== undefined) updateFields.description = updateCouponDto.description;
            if (updateCouponDto.isActive !== undefined) updateFields.isActive = updateCouponDto.isActive;
            if (updateCouponDto.validFrom !== undefined) updateFields.validFrom = updateCouponDto.validFrom;
            if (updateCouponDto.validUntil !== undefined) updateFields.validUntil = updateCouponDto.validUntil;
            if (updateCouponDto.minPurchaseAmount !== undefined) updateFields.minPurchaseAmount = updateCouponDto.minPurchaseAmount;
            if (updateCouponDto.usageLimit !== undefined) updateFields.usageLimit = updateCouponDto.usageLimit;

            // Verificar si hay algo que actualizar
            if (Object.keys(updateFields).length === 0) {
                logger.warn(`Intento de actualizar cupón ${id} sin datos.`);
                // Devolver el cupón existente sin cambios o null según prefieras
                return this.findById(id);
            }


            const updatedCoupon = await CouponModel.findByIdAndUpdate(
                id,
                { $set: updateFields }, // Usar $set con los campos explícitos
                { new: true, runValidators: true }
            );

            if (!updatedCoupon) return null;

            logger.info(`Cupón actualizado: ${updatedCoupon.code} (ID: ${id})`);
            return CouponMapper.fromObjectToCouponEntity(updatedCoupon);
        } catch (error: any) {
            // ... manejo de errores existente ...
            logger.error(`Error actualizando cupón ${id}:`, { error, dto: updateCouponDto });
            if (error.code === 11000) {
                throw CustomError.badRequest(`El código de cupón '${updateCouponDto.code}' ya existe.`);
            }
            if (error instanceof mongoose.Error.ValidationError) {
                throw CustomError.badRequest(`Error de validación: ${error.message}`);
            }
            throw CustomError.internalServerError("Error al actualizar el cupón.");
        }
    }

    async delete(id: string): Promise<CouponEntity | null> {
        // Considerar cambiar esto a una desactivación (isActive: false) en lugar de borrado físico
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) return null;
            const deletedCoupon = await CouponModel.findByIdAndDelete(id);
            if (!deletedCoupon) return null;
            logger.info(`Cupón eliminado: ${deletedCoupon.code} (ID: ${id})`);
            return CouponMapper.fromObjectToCouponEntity(deletedCoupon);
        } catch (error) {
            logger.error(`Error eliminando cupón ${id}:`, { error });
            throw CustomError.internalServerError("Error al eliminar el cupón.");
        }
    }
}