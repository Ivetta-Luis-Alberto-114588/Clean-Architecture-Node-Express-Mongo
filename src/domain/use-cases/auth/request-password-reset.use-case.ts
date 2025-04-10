// src/domain/use-cases/auth/request-password-reset.use-case.ts
import { JwtAdapter } from "../../../configs/jwt";
import { ForgotPasswordDto } from "../../dtos/auth/forgot-password.dto";
import { CustomError } from "../../errors/custom.error";
import { AuthRepository } from "../../repositories/auth.repository";
import { EmailService } from "../../interfaces/email.service"; // Importar interfaz
import { envs } from "../../../configs/envs"; // Para la URL del frontend
import logger from "../../../configs/logger";

interface IRequestPasswordResetUseCase {
    execute(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }>;
}

// Tipo para la función de generar token (más específico)
type GenerateResetToken = (payload: { id: string, purpose: string }, duration?: string) => Promise<string | null>;

export class RequestPasswordResetUseCase implements IRequestPasswordResetUseCase {

    // Inyectar dependencias
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly emailService: EmailService, // Usar la interfaz
        private readonly generateToken: GenerateResetToken = JwtAdapter.generateToken,
    ) { }

    async execute(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
        const { email } = dto;
        logger.info(`Solicitud de restablecimiento de contraseña para email: ${email}`);

        // 1. Buscar usuario por email
        const user = await this.authRepository.findByEmail(email);

        // 2. Si el usuario NO existe, devolver éxito igualmente (seguridad)
        if (!user) {
            logger.warn(`Intento de restablecimiento para email no registrado: ${email}`);
            // No revelamos si el email existe o no
            return { success: true, message: 'Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu contraseña.' };
        }

        // 3. Generar token JWT de corta duración (ej: 15 minutos)
        const tokenPayload = { id: user.id, purpose: 'password_reset' };
        const resetToken = await this.generateToken(tokenPayload, '15m');

        if (!resetToken) {
            logger.error(`Fallo al generar token de reseteo para usuario ${user.id}`);
            throw CustomError.internalServerError('No se pudo generar el enlace de restablecimiento.');
        }

        // 4. Construir enlace de restablecimiento (apuntando al frontend)
        const resetLink = `${envs.FRONTEND_URL}/reset-password?token=${resetToken}`;
        logger.debug(`Enlace de reseteo generado para ${user.email}: ${resetLink}`); // No loguear en producción

        // 5. Enviar email usando el EmailService
        const emailSent = await this.emailService.sendPasswordResetEmail(user.email, resetLink);

        if (!emailSent) {
            logger.error(`Fallo al enviar email de reseteo a ${user.email}`);
            // Podríamos lanzar un error o devolver un mensaje específico
            throw CustomError.internalServerError('No se pudo enviar el correo de restablecimiento. Inténtalo más tarde.');
        }

        logger.info(`Email de restablecimiento enviado exitosamente a ${user.email}`);
        return { success: true, message: 'Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu contraseña.' };
    }
}