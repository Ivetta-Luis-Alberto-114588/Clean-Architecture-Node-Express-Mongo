import { ManualNotificationDto } from '../../../../../src/domain/dtos/notifications/manual-notification.dto';

describe('ManualNotificationDto', () => {
    describe('create', () => {
        it('should create a valid DTO with string message', () => {
            const data = { subject: 'Test', message: 'Hello', emailTo: 'a@b.com', telegramChatId: '123' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.subject).toBe('Test');
            expect(dto!.message).toBe('Hello');
            expect(dto!.emailTo).toBe('a@b.com');
            expect(dto!.telegramChatId).toBe('123');
        });

        it('should return error if subject is missing', () => {
            const data = { message: 'Hello' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if message is missing', () => {
            const data = { subject: 'Test' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if subject is not a string', () => {
            const data = { subject: 123, message: 'Hello' };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if message is not a string', () => {
            const data = { subject: 'Test', message: 123 };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should return error if message is an object (JSON)', () => {
            const data = { subject: 'Test', message: { foo: 'bar' } };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeDefined();
            expect(dto).toBeUndefined();
        });

        it('should allow message to be a JSON string', () => {
            const data = { subject: 'Test', message: JSON.stringify({ foo: 'bar' }) };
            const [error, dto] = ManualNotificationDto.create(data);
            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.message).toBe('{"foo":"bar"}');
        });
    });
});
