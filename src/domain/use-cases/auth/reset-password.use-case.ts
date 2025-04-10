// src/domain/use-cases/auth/reset-password.use-case.ts
import { JwtAdapter } from "../../../configs/jwt";
import { ResetPasswordDto } from "../../dtos/auth/reset-password.dto";
import { CustomError } from "../../errors/custom.error";
import { AuthRepository } from "../../repositories/auth.repository";
import { BcryptAdapter } from "../../../configs/bcrypt"; // Para hashear
import logger from "../../../configs/logger";

interface IResetPasswordUseCase {
    execute(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }>;
}

// Tipo para la función de validar token
type ValidateToken = <T>(token: string) => Promise<T | null>;
// Tipo para la función de hashear
type HashFunction = (password: string) => string;

interface ResetTokenPayload {
    id: string;
    purpose: string;
    iat: number;
    exp: number;
}

export class ResetPasswordUseCase implements IResetPasswordUseCase {

    constructor(
        private readonly authRepository: AuthRepository,
        private readonly validateToken: ValidateToken = JwtAdapter.validateToken,
        private readonly hashPassword: HashFunction = BcryptAdapter.hash,
    ) { }

    async execute(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
        const { token, newPassword } = dto; // passwordConfirmation ya se validó en DTO

        // 1. Validar el token JWT
        const payload = await this.validateToken<ResetTokenPayload>(token);

        if (!payload) {
            logger.warn('Intento de restablecimiento con token inválido o expirado.');
            throw CustomError.unauthorized('El enlace de restablecimiento es inválido o ha expirado.');
        }

        // 2. Verificar el propósito del token
        if (payload.purpose !== 'password_reset') {
            logger.warn(`Intento de usar token con propósito incorrecto: ${payload.purpose} para usuario ${payload.id}`);
            throw CustomError.unauthorized('Token inválido para esta acción.');
        }

        // 3. Hashear la nueva contraseña
        const hashedPassword = this.hashPassword(newPassword);

        // 4. Actualizar la contraseña en la base de datos
        const updated = await this.authRepository.updatePassword(payload.id, hashedPassword);

        if (!updated) {
            // Esto podría pasar si el usuario fue eliminado entre la solicitud y el reseteo
            logger.error(`No se pudo actualizar la contraseña para el usuario ${payload.id} (posiblemente eliminado).`);
            throw CustomError.internalServerError('No se pudo actualizar la contraseña. El usuario podría no existir.');
        }

        logger.info(`Contraseña restablecida exitosamente para el usuario ${payload.id}`);
        // Aquí podrías enviar un email de confirmación de cambio de contraseña

        return { success: true, message: 'Contraseña actualizada correctamente.' };
    }
}