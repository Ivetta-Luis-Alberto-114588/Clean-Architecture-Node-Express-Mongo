// src/domain/dtos/auth/reset-password.dto.ts

export class ResetPasswordDto {

    private constructor(
        public readonly token: string,
        public readonly newPassword: string,
        public readonly passwordConfirmation: string,
    ) { }

    static create(props: { [key: string]: any }): [string?, ResetPasswordDto?] {
        const { token, newPassword, passwordConfirmation } = props;

        if (!token) return ['El token de restablecimiento es requerido', undefined];
        if (!newPassword) return ['La nueva contraseña es requerida', undefined];
        if (newPassword.length < 6) return ['La nueva contraseña debe tener al menos 6 caracteres', undefined];
        if (!passwordConfirmation) return ['La confirmación de contraseña es requerida', undefined];
        if (newPassword !== passwordConfirmation) return ['Las contraseñas no coinciden', undefined];

        return [undefined, new ResetPasswordDto(token, newPassword, passwordConfirmation)];
    }
}