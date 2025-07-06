// src/infrastructure/adapters/nodemailer.adapter.ts
import nodemailer from 'nodemailer';
import { envs } from '../../configs/envs';
import { EmailOptions, EmailService, Attachment } from '../../domain/interfaces/email.service'; // <<<--- Asegúrate de importar Attachment
import logger from '../../configs/logger';

// Asegúrate de que estas variables estén en src/configs/envs.ts y .env
// EMAIL_SERVICE: get('EMAIL_SERVICE').required().asString(),
// EMAIL_USER: get('EMAIL_USER').required().asString(),
// EMAIL_PASS: get('EMAIL_PASS').required().asString(),
// EMAIL_SENDER_NAME: get('EMAIL_SENDER_NAME').default('StartUp E-commerce').asString(),

export class NodemailerAdapter implements EmailService { // <<<--- Asegúrate que implementa EmailService

    private transporter: nodemailer.Transporter;
    private readonly senderName = envs.EMAIL_SENDER_NAME;
    private readonly senderEmail = envs.EMAIL_USER;

    constructor() {
        try { // Añadir try-catch para la configuración inicial
            this.transporter = nodemailer.createTransport({
                service: envs.EMAIL_SERVICE,
                auth: {
                    user: envs.EMAIL_USER,
                    pass: envs.EMAIL_PASS,
                },
                // Opciones adicionales para mejorar la entregabilidad (opcional)
                pool: true, // Usar pool de conexiones
                maxConnections: 5,
                maxMessages: 100,
                rateLimit: 10 // Limitar a 10 mensajes por segundo
            });
            logger.info(`Servicio de Email (${envs.EMAIL_SERVICE}) configurado para enviar desde ${this.senderEmail}`);

            // Verificar conexión solo si no estamos en modo test
            if (process.env.NODE_ENV !== 'test') {
                this.verifyConnection();
            }

        } catch (error) {
            logger.error('Error configurando Nodemailer transporter:', { error });
            // Lanzar un error o manejarlo según tu estrategia de inicio de aplicación
            throw new Error('Fallo al configurar el servicio de email.');
        }
    }

    // Método para verificar la conexión SMTP
    private async verifyConnection(): Promise<void> {
        try {
            await this.transporter.verify();
            logger.info('Conexión SMTP verificada correctamente.');
        } catch (error) {
            logger.error('Error verificando conexión SMTP:', { error });
        }
    }


    async sendEmail(options: EmailOptions): Promise<boolean> {
        const { to, subject, htmlBody, attachments = [] } = options;
        const timestamp = new Date().toISOString();

        logger.info(`📧 [NodemailerAdapter] === INICIO ENVÍO EMAIL ===`, {
            timestamp,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            htmlBodyLength: htmlBody.length,
            attachmentsCount: attachments.length,
            from: `"${this.senderName}" <${this.senderEmail}>`
        });

        try {
            logger.info(`📤 [NodemailerAdapter] Llamando a transporter.sendMail`);

            const mailOptions = {
                from: `"${this.senderName}" <${this.senderEmail}>`,
                to: to,
                subject: subject,
                html: htmlBody,
                attachments: attachments,
            };

            logger.info(`📋 [NodemailerAdapter] Opciones de correo preparadas`, {
                mailOptions: {
                    ...mailOptions,
                    html: htmlBody.substring(0, 200) + (htmlBody.length > 200 ? '...' : '')
                }
            });

            const info = await this.transporter.sendMail(mailOptions);

            logger.info(`✅ [NodemailerAdapter] === EMAIL ENVIADO EXITOSAMENTE ===`, {
                to: Array.isArray(to) ? to.join(', ') : to,
                messageId: info.messageId,
                response: info.response,
                accepted: info.accepted,
                rejected: info.rejected,
                timestamp: new Date().toISOString()
            });
            // Log para tests: mensaje resumido
            const toList = Array.isArray(to) ? to.join(', ') : to;
            logger.info(
                `Email enviado exitosamente a ${toList}. Message ID: ${info.messageId}`
            );

            return true;
        } catch (error) {
            // Log crítico detallado
            logger.error(`💥 [NodemailerAdapter] === ERROR CRÍTICO EN ENVÍO EMAIL ===`, {
                error: error instanceof Error ? { message: error.message, code: (error as any).code } : error,
                errorType: error.constructor.name,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                timestamp: new Date().toISOString(),
                stack: error instanceof Error ? error.stack : undefined
            });
            // Log para tests: mensaje resumido
            const errorMeta = error instanceof Error ? { message: error.message, code: (error as any).code } : error;
            const toListErr = Array.isArray(to) ? to.join(', ') : to;
            logger.error(
                'Error enviando email:',
                {
                    error: errorMeta,
                    to: toListErr,
                    subject
                }
            );
            return false;
        }
    }

    // <<<--- AÑADIR EL MÉTODO FALTANTE --- >>>
    // Implementación del método específico para reseteo, llamando al genérico sendEmail
    async sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
        const subject = 'Restablecimiento de Contraseña - StartUp E-commerce';
        const htmlBody = `
            <h1>Restablecimiento de Contraseña</h1>
            <p>Has solicitado restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
            <a href="${resetLink}" target="_blank" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer Contraseña</a>
            <p>Este enlace expirará en 15 minutos.</p>
            <p>Si no solicitaste esto, puedes ignorar este correo.</p>
            <hr>
            <p style="font-size: 0.8em; color: #666;">Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:</p>
            <p style="font-size: 0.8em; color: #666; word-break: break-all;">${resetLink}</p>
        `;

        // Llama al método genérico sendEmail
        return this.sendEmail({ to, subject, htmlBody });
    }
    // <<<--- FIN MÉTODO AÑADIDO --- >>>
}