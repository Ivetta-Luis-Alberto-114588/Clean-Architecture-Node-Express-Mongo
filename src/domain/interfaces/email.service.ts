// src/domain/interfaces/email.service.ts

export interface EmailOptions {
    to: string | string[];
    subject: string;
    htmlBody: string;
    attachments?: Attachment[];
}

export interface Attachment {
    filename: string;
    path: string;
}

export abstract class EmailService {
    abstract sendEmail(options: EmailOptions): Promise<boolean>;

    // Método específico para el reseteo de contraseña
    async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
        const subject = 'Restablecimiento de Contraseña - StartUp E-commerce';
        const htmlBody = `
            <h1>Restablecimiento de Contraseña</h1>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
            <a href="${resetLink}" target="_blank">Restablecer Contraseña</a>
            <p>Este enlace expirará en 15 minutos.</p>
            <p>Si no solicitaste esto, puedes ignorar este correo.</p>
        `;

        return this.sendEmail({ to, subject, htmlBody });
    }
}