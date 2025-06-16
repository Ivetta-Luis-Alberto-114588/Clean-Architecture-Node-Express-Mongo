// tests/unit/domain/dtos/auth/reset-password.dto.test.ts
import { ResetPasswordDto } from '../../../../../src/domain/dtos/auth/reset-password.dto';

describe('ResetPasswordDto', () => {
    describe('create', () => {
        it('should create valid DTO when all required fields are provided', () => {
            const validData = {
                token: 'valid-reset-token-123',
                newPassword: 'newPassword123',
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.token).toBe('valid-reset-token-123');
            expect(dto!.newPassword).toBe('newPassword123');
            expect(dto!.passwordConfirmation).toBe('newPassword123');
        });

        it('should return error when token is missing', () => {
            const invalidData = {
                newPassword: 'newPassword123',
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El token de restablecimiento es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when token is null', () => {
            const invalidData = {
                token: null,
                newPassword: 'newPassword123',
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El token de restablecimiento es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when token is empty string', () => {
            const invalidData = {
                token: '',
                newPassword: 'newPassword123',
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('El token de restablecimiento es requerido');
            expect(dto).toBeUndefined();
        });

        it('should return error when newPassword is missing', () => {
            const invalidData = {
                token: 'valid-token',
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La nueva contraseña es requerida');
            expect(dto).toBeUndefined();
        });

        it('should return error when newPassword is null', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: null,
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La nueva contraseña es requerida');
            expect(dto).toBeUndefined();
        });

        it('should return error when newPassword is empty string', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: '',
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La nueva contraseña es requerida');
            expect(dto).toBeUndefined();
        });

        it('should return error when newPassword is too short', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: '12345', // 5 characters, less than 6
                passwordConfirmation: '12345'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La nueva contraseña debe tener al menos 6 caracteres');
            expect(dto).toBeUndefined();
        });

        it('should accept newPassword with exactly 6 characters', () => {
            const validData = {
                token: 'valid-token',
                newPassword: '123456',
                passwordConfirmation: '123456'
            };

            const [error, dto] = ResetPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.newPassword).toBe('123456');
        });

        it('should return error when passwordConfirmation is missing', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La confirmación de contraseña es requerida');
            expect(dto).toBeUndefined();
        });

        it('should return error when passwordConfirmation is null', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: 'newPassword123',
                passwordConfirmation: null
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La confirmación de contraseña es requerida');
            expect(dto).toBeUndefined();
        });

        it('should return error when passwordConfirmation is empty string', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: 'newPassword123',
                passwordConfirmation: ''
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('La confirmación de contraseña es requerida');
            expect(dto).toBeUndefined();
        });

        it('should return error when passwords do not match', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: 'newPassword123',
                passwordConfirmation: 'differentPassword456'
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('Las contraseñas no coinciden');
            expect(dto).toBeUndefined();
        });

        it('should handle complex passwords with special characters', () => {
            const validData = {
                token: 'valid-token-abc123',
                newPassword: 'ComplexP@ssw0rd!#$',
                passwordConfirmation: 'ComplexP@ssw0rd!#$'
            };

            const [error, dto] = ResetPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.newPassword).toBe('ComplexP@ssw0rd!#$');
            expect(dto!.passwordConfirmation).toBe('ComplexP@ssw0rd!#$');
        });

        it('should handle long tokens', () => {
            const validData = {
                token: 'this-is-a-very-long-token-with-many-characters-and-special-symbols-123456789',
                newPassword: 'newPassword123',
                passwordConfirmation: 'newPassword123'
            };

            const [error, dto] = ResetPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.token).toBe('this-is-a-very-long-token-with-many-characters-and-special-symbols-123456789');
        });

        it('should be case sensitive for password matching', () => {
            const invalidData = {
                token: 'valid-token',
                newPassword: 'Password123',
                passwordConfirmation: 'password123' // Different case
            };

            const [error, dto] = ResetPasswordDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('Las contraseñas no coinciden');
            expect(dto).toBeUndefined();
        });

        it('should handle whitespace in passwords', () => {
            const validData = {
                token: 'valid-token',
                newPassword: 'password with spaces',
                passwordConfirmation: 'password with spaces'
            };

            const [error, dto] = ResetPasswordDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.newPassword).toBe('password with spaces');
        });
    });
});
