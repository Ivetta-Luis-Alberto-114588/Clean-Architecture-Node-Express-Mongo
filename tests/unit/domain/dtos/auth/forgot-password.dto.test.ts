// tests/unit/domain/dtos/auth/forgot-password.dto.test.ts
import { ForgotPasswordDto } from '../../../../../src/domain/dtos/auth/forgot-password.dto';

describe('ForgotPasswordDto', () => {
    describe('create', () => {
        it('should create valid DTO when email is provided', () => {
            const validData = {
                email: 'test@example.com'
            };

            const [error, dto] = ForgotPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.email).toBe('test@example.com');
        });        it('should convert email to lowercase and trim', () => {
            const validData = {
                email: 'TEST@EXAMPLE.COM'
            };

            const [error, dto] = ForgotPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.email).toBe('test@example.com');
        });        it('should handle email with leading and trailing spaces', () => {
            const invalidData = {
                email: '  test@example.com  '
            };

            const [error, dto] = ForgotPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El formato del email no es válido');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is missing', () => {
            const invalidData = {};

            const [error, dto] = ForgotPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El email es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is null', () => {
            const invalidData = {
                email: null
            };

            const [error, dto] = ForgotPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El email es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is empty string', () => {
            const invalidData = {
                email: ''
            };

            const [error, dto] = ForgotPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El email es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when email format is invalid', () => {
            const invalidData = {
                email: 'invalid-email'
            };

            const [error, dto] = ForgotPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El formato del email no es válido');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is missing @ symbol', () => {
            const invalidData = {
                email: 'testexample.com'
            };

            const [error, dto] = ForgotPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El formato del email no es válido');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is missing domain', () => {
            const invalidData = {
                email: 'test@'
            };

            const [error, dto] = ForgotPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El formato del email no es válido');
            expect(dto).toBeUndefined();
        });

        it('should accept valid email with numbers and special characters', () => {
            const validData = {
                email: 'test.user-123@example-domain.co.uk'
            };

            const [error, dto] = ForgotPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.email).toBe('test.user-123@example-domain.co.uk');
        });
    });
});
