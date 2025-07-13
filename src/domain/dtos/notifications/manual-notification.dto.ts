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
        // emailTo y telegramChatId son opcionales
        return [undefined, new ManualNotificationDto(subject, message, emailTo, telegramChatId)];
    }
}
