// src/presentation/middlewares/auth.middleware.ts
import { NextFunction, Request, Response } from "express";
import { JwtAdapter } from "../../configs/jwt";
import { UserModel } from "../../data/mongodb/models/user.model";
import { UserEntity } from "../../domain/entities/user.entity";
import { CustomError } from "../../domain/errors/custom.error";
import logger from "../../configs/logger";
import { UserMapper } from "../../infrastructure/mappers/user.mapper"; // <<<--- Asegurar importación

export class AuthMiddleware {

    static validateJwt = async (req: Request, res: Response, next: NextFunction) => {
        const authorization = req.header('Authorization');

        if (!authorization) return next(CustomError.unauthorized("No authorization header provided"));
        if (!authorization.startsWith("Bearer ")) return next(CustomError.unauthorized("Invalid Bearer token"));

        const token = authorization.split(' ')[1] || "";

        try {
            const payload = await JwtAdapter.validateToken<{ id: string }>(token);
            if (!payload) return next(CustomError.unauthorized("Invalid token"));

            const user = await UserModel.findById(payload.id);
            if (!user) return next(CustomError.unauthorized("Invalid token - user not found"));

            // Añadir la entidad mapeada, no el documento Mongoose directamente
            req.body.user = UserMapper.fromObjectToUserEntity(user);
            next();

        } catch (error) {
            logger.error("Error validating JWT:", { error });
            next(CustomError.internalServerError("Internal server error during JWT validation"));
        }
    }

    static checkRole = (allowedRoles: string[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = req.body.user as UserEntity;

            if (!user) {
                logger.error("AuthMiddleware.checkRole ejecutado sin usuario autenticado en req.body.user");
                return next(CustomError.internalServerError("Error de autenticación interna"));
            }

            const hasRequiredRole = user.role.some(role => allowedRoles.includes(role));

            if (!hasRequiredRole) {
                logger.warn(`Acceso denegado para usuario ${user.id} (${user.email}). Rol requerido: ${allowedRoles.join('/')}, Rol del usuario: ${user.role.join('/')}`);
                return next(CustomError.forbiden(`Acceso denegado. Requiere rol: ${allowedRoles.join(' o ')}`));
            }

            logger.debug(`Acceso permitido para usuario ${user.id} con rol ${user.role.join('/')} para roles ${allowedRoles.join('/')}`);
            next();
        }
    }
}