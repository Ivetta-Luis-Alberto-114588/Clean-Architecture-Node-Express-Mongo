// tests/unit/infrastructure/adapters/nodemailer.adapter.test.ts
import { NodemailerAdapter } from '../../../../src/infrastructure/adapters/nodemailer.adapter';
import logger from '../../../../src/configs/logger';

// Mock de nodemailer
const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockTransporter = {
    sendMail: mockSendMail,
    verify: mockVerify
};

jest.mock('nodemailer', () => ({
    createTransporter: jest.fn(() => mockTransporter),
    createTransport: jest.fn(() => mockTransporter)
}));

// Mock del logger
jest.mock('../../../../src/configs/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        http: jest.fn()
    }
}));

// Type cast para el mock del logger
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock de las variables de entorno
jest.mock('../../../../src/configs/envs', () => ({
    envs: {
        EMAIL_SERVICE: 'gmail',
        EMAIL_USER: 'test@example.com',
        EMAIL_PASS: 'test-password',
        EMAIL_SENDER_NAME: 'Test E-commerce'
    }
}));

// Mock de process.env para evitar verificación de conexión en tests
const originalNodeEnv = process.env.NODE_ENV;

describe('NodemailerAdapter', () => {
    let nodemailerAdapter: NodemailerAdapter;

    beforeAll(() => {
        process.env.NODE_ENV = 'test';
    });

    afterAll(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });

    beforeEach(() => {
        mockSendMail.mockClear();
        mockVerify.mockClear();
        mockLogger.info.mockClear();
        mockLogger.error.mockClear();
        mockLogger.warn.mockClear();
        mockLogger.debug.mockClear();

        nodemailerAdapter = new NodemailerAdapter();
    });

    describe('constructor', () => {
        it('should create transporter with correct configuration', () => {
            const nodemailer = require('nodemailer');

            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                service: 'gmail',
                auth: {
                    user: 'test@example.com',
                    pass: 'test-password'
                },
                pool: true,
                maxConnections: 5,
                maxMessages: 100,
                rateLimit: 10
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Servicio de Email (gmail) configurado para enviar desde test@example.com'
            );
        });
    });

    describe('sendEmail', () => {
        it('should send email successfully with minimal options', async () => {
            const mockInfo = {
                messageId: 'test-message-id-123',
                response: '250 OK'
            };
            mockSendMail.mockResolvedValue(mockInfo);

            const emailOptions = {
                to: 'recipient@example.com',
                subject: 'Test Subject',
                htmlBody: '<h1>Test HTML Content</h1>'
            };

            const result = await nodemailerAdapter.sendEmail(emailOptions); expect(mockSendMail).toHaveBeenCalledWith({
                from: '"Test E-commerce" <test@example.com>',
                to: 'recipient@example.com',
                subject: 'Test Subject',
                html: '<h1>Test HTML Content</h1>',
                attachments: []
            });

            expect(result).toBe(true);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Email enviado exitosamente a recipient@example.com. Message ID: test-message-id-123'
            );
        });

        it('should send email with all options', async () => {
            const mockInfo = {
                messageId: 'test-message-id-456',
                response: '250 OK'
            };
            mockSendMail.mockResolvedValue(mockInfo); const emailOptions = {
                to: ['user1@example.com', 'user2@example.com'],
                subject: 'Complete Test',
                htmlBody: '<h1>Complete HTML Content</h1>',
                attachments: [
                    {
                        filename: 'document.pdf',
                        path: '/path/to/document.pdf'
                    }
                ]
            };

            const result = await nodemailerAdapter.sendEmail(emailOptions); expect(mockSendMail).toHaveBeenCalledWith({
                from: '"Test E-commerce" <test@example.com>',
                to: ['user1@example.com', 'user2@example.com'],
                subject: 'Complete Test',
                html: '<h1>Complete HTML Content</h1>',
                attachments: [
                    {
                        filename: 'document.pdf',
                        path: '/path/to/document.pdf'
                    }
                ]
            });

            expect(result).toBe(true);
            expect(mockLogger.info).toHaveBeenCalledWith(
                'Email enviado exitosamente a user1@example.com, user2@example.com. Message ID: test-message-id-456'
            );
        });

        it('should handle email sending errors', async () => {
            const emailError = new Error('SMTP Error: Authentication failed');
            (emailError as any).code = 'EAUTH';
            mockSendMail.mockRejectedValue(emailError);

            const emailOptions = {
                to: 'recipient@example.com',
                subject: 'Test Subject',
                htmlBody: '<h1>Test Content</h1>'
            };

            const result = await nodemailerAdapter.sendEmail(emailOptions);

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error enviando email:',
                {
                    error: {
                        message: 'SMTP Error: Authentication failed',
                        code: 'EAUTH'
                    },
                    to: 'recipient@example.com',
                    subject: 'Test Subject'
                }
            );
        });

        it('should handle non-Error objects in catch block', async () => {
            const stringError = 'String error message';
            mockSendMail.mockRejectedValue(stringError);

            const emailOptions = {
                to: 'recipient@example.com',
                subject: 'Test Subject',
                htmlBody: '<h1>Test Content</h1>'
            };

            const result = await nodemailerAdapter.sendEmail(emailOptions);

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith(
                'Error enviando email:',
                {
                    error: 'String error message',
                    to: 'recipient@example.com',
                    subject: 'Test Subject'
                }
            );
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('should send password reset email with correct content', async () => {
            const mockInfo = {
                messageId: 'reset-message-id-123',
                response: '250 OK'
            };
            mockSendMail.mockResolvedValue(mockInfo);

            const result = await nodemailerAdapter.sendPasswordResetEmail(
                'user@example.com',
                'https://example.com/reset?token=abc123'
            );

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: '"Test E-commerce" <test@example.com>',
                    to: 'user@example.com',
                    subject: 'Restablecimiento de Contraseña - StartUp E-commerce'
                })
            );

            const callArgs = mockSendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('Restablecimiento de Contraseña');
            expect(callArgs.html).toContain('https://example.com/reset?token=abc123');
            expect(callArgs.html).toContain('Este enlace expirará en 15 minutos');

            expect(result).toBe(true);
        });

        it('should handle password reset email errors', async () => {
            const emailError = new Error('Email sending failed');
            mockSendMail.mockRejectedValue(emailError);

            const result = await nodemailerAdapter.sendPasswordResetEmail(
                'user@example.com',
                'https://example.com/reset?token=abc123'
            );

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('verifyConnection', () => {
        it('should verify connection successfully when not in test environment', async () => {
            // Temporarily change NODE_ENV
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            mockVerify.mockResolvedValue(true);

            // Create new instance to trigger verifyConnection
            new NodemailerAdapter();

            // Wait for async verification
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockVerify).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Conexión SMTP verificada correctamente.');

            // Restore NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });

        it('should handle connection verification errors when not in test environment', async () => {
            // Temporarily change NODE_ENV
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const verifyError = new Error('Connection failed');
            mockVerify.mockRejectedValue(verifyError);

            // Create new instance to trigger verifyConnection
            new NodemailerAdapter();

            // Wait for async verification
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockVerify).toHaveBeenCalled(); expect(mockLogger.error).toHaveBeenCalledWith(
                'Error verificando conexión SMTP:',
                { error: verifyError }
            );

            // Restore NODE_ENV
            process.env.NODE_ENV = originalEnv;
        });
    });
});
