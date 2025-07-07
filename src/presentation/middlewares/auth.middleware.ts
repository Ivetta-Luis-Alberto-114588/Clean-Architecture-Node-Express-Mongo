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
        logger.debug("validateJwt middleware started");

        const authorization = req.header('Authorization');
        logger.debug("Authorization header", { authorization: authorization ? `Bearer ${authorization.substring(0, 20)}...` : 'missing' });

        if (!authorization) return next(CustomError.unauthorized("No authorization header provided"));
        if (!authorization.startsWith("Bearer ")) return next(CustomError.unauthorized("Invalid Bearer token"));

        const token = authorization.split(' ')[1] || "";
        logger.debug("Extracted token", { tokenLength: token.length, tokenStart: token.substring(0, 20) + '...' });

        try {
            const payload = await JwtAdapter.validateToken<{ id: string }>(token);
            logger.debug("Token validation result", { payloadExists: !!payload, userId: payload?.id });

            if (!payload) return next(CustomError.unauthorized("Invalid token"));

            const user = await UserModel.findById(payload.id);
            logger.debug("User lookup result", { userFound: !!user, userId: user?._id, userEmail: user?.email });

            if (!user) return next(CustomError.unauthorized("Invalid token - user not found"));

            // Añadir la entidad mapeada, no el documento Mongoose directamente
            const mappedUser = UserMapper.fromObjectToUserEntity(user); logger.debug("JWT validation successful", {
                userId: mappedUser.id,
                userEmail: mappedUser.email,
                userRoles: mappedUser.roles
            });
            req.body.user = mappedUser;
            next();

        } catch (error) {
            logger.error("Error validating JWT:", { error });
            next(CustomError.internalServerError("Internal server error during JWT validation"));
        }
    }

    static checkRole = (allowedRoles: string[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
            logger.debug("checkRole middleware started", { allowedRoles }); const user = req.body.user as UserEntity; logger.debug("User from req.body.user", {
                userExists: !!user,
                userId: user?.id,
                userEmail: user?.email,
                userRoles: user?.roles,
                userRoleType: typeof user?.roles,
                isArray: Array.isArray(user?.roles)
            });

            if (!user) {
                logger.error("AuthMiddleware.checkRole ejecutado sin usuario autenticado en req.body.user");
                return next(CustomError.internalServerError("Error de autenticación interna"));
            } const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));
            logger.debug("Role check result", {
                hasRequiredRole,
                userRoles: user.roles,
                allowedRoles
            }); if (!hasRequiredRole) {
                logger.warn(`Acceso denegado para usuario ${user.id} (${user.email}). Rol requerido: ${allowedRoles.join('/')}, Rol del usuario: ${user.roles.join('/')}`);
                return next(CustomError.forbiden(`Acceso denegado. Requiere rol: ${allowedRoles.join(' o ')}`));
            }

            logger.debug(`Acceso permitido para usuario ${user.id} con rol ${user.roles.join('/')} para roles ${allowedRoles.join('/')}`);
            next();
        }
    }

    /**
     * Middleware de validación JWT opcional para rutas que permiten tanto usuarios autenticados como invitados
     * Si hay token, lo valida. Si no hay token, continúa sin error.
     */
    static validateJwtOptional = async (req: Request, res: Response, next: NextFunction) => {
        logger.debug("validateJwtOptional middleware started");

        const authorization = req.header('Authorization');
        
        // Si no hay header de autorización, continuar como invitado
        if (!authorization) {
            logger.debug("No authorization header - continuing as guest");
            return next();
        }
        
        // Si hay header pero no es Bearer, continuar como invitado
        if (!authorization.startsWith("Bearer ")) {
            logger.debug("Invalid Bearer format - continuing as guest");
            return next();
        }

        const token = authorization.split(' ')[1] || "";
        
        // Si no hay token, continuar como invitado
        if (!token) {
            logger.debug("No token provided - continuing as guest");
            return next();
        }

        try {
            const payload = await JwtAdapter.validateToken<{ id: string }>(token);
            
            if (!payload) {
                logger.debug("Invalid token - continuing as guest");
                return next();
            }

            const user = await UserModel.findById(payload.id);
            
            if (!user) {
                logger.debug("User not found for token - continuing as guest");
                return next();
            }

            // Si todo está bien, añadir el usuario autenticado
            const mappedUser = UserMapper.fromObjectToUserEntity(user);
            logger.debug("Optional JWT validation successful", {
                userId: mappedUser.id,
                userEmail: mappedUser.email,
                userRoles: mappedUser.roles
            });
            req.body.user = mappedUser;
            next();

        } catch (error) {
            // En caso de error, continuar como invitado en lugar de fallar
            logger.debug("Error in optional JWT validation - continuing as guest:", { error });
            next();
        }
    }
}