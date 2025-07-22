// src/domain/dtos/notifications/manual-notification.dto.ts

export class ManualNotificationDto {
    private constructor(
        public subject: string,
        public message: string,
        public emailTo?: string,
        public telegramChatId?: string
    ) { }

    static create(obj: any): [string?, ManualNotificationDto?] {
        const { subject, message, emailTo, telegramChatId } = obj;

        if (!subject || typeof subject !== 'string') {
            return ['subject es requerido y debe ser string', undefined];
        }

        if (!message || typeof message !== 'string') {
            return ['message es requerido y debe ser string', undefined];
        }

        // Validar longitud del mensaje para Telegram (máximo 4096 caracteres)
        const fullMessage = `<b>${subject}</b>\n\n${message}`;
        if (fullMessage.length > 4096) {
            return ['El mensaje es demasiado largo. Máximo 4096 caracteres permitidos (incluyendo el título)', undefined];
        }

        // emailTo es opcional pero debe ser válido si se proporciona
        if (emailTo && typeof emailTo !== 'string') {
            return ['emailTo debe ser string si se proporciona', undefined];
        }

        // Validación básica de email si se proporciona
        if (emailTo && !emailTo.includes('@')) {
            return ['emailTo debe ser un email válido', undefined];
        }

        // telegramChatId es opcional
        if (telegramChatId && typeof telegramChatId !== 'string') {
            return ['telegramChatId debe ser string si se proporciona', undefined];
        }

        return [undefined, new ManualNotificationDto(subject, message, emailTo, telegramChatId)];
    }
}
