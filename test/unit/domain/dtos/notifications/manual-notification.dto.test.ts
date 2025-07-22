import { ManualNotificationDto } from '../../../../../src/domain/dtos/notifications/manual-notification.dto';

describe('ManualNotificationDto', () => {
    describe('create', () => {
        it('should create a valid DTO with required fields only', () => {
            const data = { subject: 'Test', message: 'Hello' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.subject).toBe('Test');
            expect(dto!.message).toBe('Hello');
            expect(dto!.emailTo).toBeUndefined();
            expect(dto!.telegramChatId).toBeUndefined();
        });

        it('should create a valid DTO with all fields', () => {
            const data = {
                subject: 'Test',
                message: 'Hello',
                emailTo: 'test@email.com',
                telegramChatId: '123456789'
            };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.subject).toBe('Test');
            expect(dto!.message).toBe('Hello');
            expect(dto!.emailTo).toBe('test@email.com');
            expect(dto!.telegramChatId).toBe('123456789');
        });

        it('should return error if subject is missing', () => {
            const data = { message: 'Hello' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('subject es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error if message is missing', () => {
            const data = { subject: 'Test' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('message es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error if subject is not a string', () => {
            const data = { subject: 123, message: 'Hello' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('subject es requerido y debe ser string');
            expect(dto).toBeUndefined();
        });

        it('should return error if message is not a string', () => {
            const data = { subject: 'Test', message: 123 };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('message es requerido y debe ser string');
            expect(dto).toBeUndefined();
        });

        it('should return error if message is an object (JSON)', () => {
            const data = { subject: 'Test', message: { foo: 'bar' } };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('message es requerido y debe ser string');
            expect(dto).toBeUndefined();
        });

        it('should allow message to be a JSON string', () => {
            const data = { subject: 'Test', message: JSON.stringify({ foo: 'bar' }) };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.message).toBe('{"foo":"bar"}');
        });

        it('should return error if telegramChatId is not a string', () => {
            const data = { subject: 'Test', message: 'Hello', telegramChatId: 123 };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('telegramChatId debe ser string');
            expect(dto).toBeUndefined();
        });

        it('should return error if emailTo is not a string', () => {
            const data = { subject: 'Test', message: 'Hello', emailTo: 123 };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('emailTo debe ser string');
            expect(dto).toBeUndefined();
        });

        it('should return error if emailTo is invalid', () => {
            const data = { subject: 'Test', message: 'Hello', emailTo: 'invalid-email' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('emailTo debe ser un email válido');
            expect(dto).toBeUndefined();
        });

        it('should return error if message is too long for Telegram', () => {
            const longMessage = 'a'.repeat(4090); // Crear un mensaje muy largo que con el título supere 4096
            const data = { subject: 'Test', message: longMessage };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(error).toContain('demasiado largo');
            expect(dto).toBeUndefined();
        });

        it('should accept message with reasonable length', () => {
            const reasonableMessage = 'a'.repeat(3000); // Mensaje largo pero aceptable
            const data = { subject: 'Test', message: reasonableMessage };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
        });
    });
});
