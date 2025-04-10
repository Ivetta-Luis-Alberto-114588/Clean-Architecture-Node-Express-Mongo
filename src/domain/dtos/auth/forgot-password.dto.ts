// src/domain/dtos/auth/forgot-password.dto.ts
import { Validators } from "../../../configs/validator";

export class ForgotPasswordDto {

    private constructor(
        public readonly email: string,
    ) { }

    static create(props: { [key: string]: any }): [string?, ForgotPasswordDto?] {
        const { email } = props;

        if (!email) return ['El email es requerido', undefined];
        if (!Validators.checkEmail.test(email)) return ['El formato del email no es válido', undefined];

        return [undefined, new ForgotPasswordDto(email.toLowerCase().trim())];
    }
}