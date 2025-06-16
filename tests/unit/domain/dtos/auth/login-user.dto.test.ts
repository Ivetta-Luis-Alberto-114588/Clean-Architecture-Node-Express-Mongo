// tests/unit/domain/dtos/auth/login-user.dto.test.ts
import { LoginUserDto } from '../../../../../src/domain/dtos/auth/login-user.dto';

describe('LoginUserDto', () => {
    describe('login', () => {
        it('should create valid DTO when email and password are provided', () => {
            const validData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const [error, dto] = LoginUserDto.login(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.email).toBe('test@example.com');
            expect(dto!.password).toBe('password123');
        });

        it('should return error when email is missing', () => {
            const invalidData = {
                password: 'password123'
            };

            const [error, dto] = LoginUserDto.login(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is null', () => {
            const invalidData = {
                email: null,
                password: 'password123'
            };

            const [error, dto] = LoginUserDto.login(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is empty string', () => {
            const invalidData = {
                email: '',
                password: 'password123'
            };

            const [error, dto] = LoginUserDto.login(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when email format is invalid', () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'password123'
            };

            const [error, dto] = LoginUserDto.login(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email has not a valid format');
            expect(dto).toBeUndefined();
        });

        it('should return error when password is missing', () => {
            const invalidData = {
                email: 'test@example.com'
            };

            const [error, dto] = LoginUserDto.login(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('password is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when password is null', () => {
            const invalidData = {
                email: 'test@example.com',
                password: null
            };

            const [error, dto] = LoginUserDto.login(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('password is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when password is empty string', () => {
            const invalidData = {
                email: 'test@example.com',
                password: ''
            };

            const [error, dto] = LoginUserDto.login(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('password is required');
            expect(dto).toBeUndefined();
        });

        it('should accept valid email with special characters', () => {
            const validData = {
                email: 'test.user-123@example-domain.co.uk',
                password: 'mySecurePassword!'
            };

            const [error, dto] = LoginUserDto.login(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.email).toBe('test.user-123@example-domain.co.uk');
            expect(dto!.password).toBe('mySecurePassword!');
        });

        it('should handle different password lengths', () => {
            const validData = {
                email: 'test@example.com',
                password: 'a'
            };

            const [error, dto] = LoginUserDto.login(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.password).toBe('a');
        });

        it('should handle special characters in password', () => {
            const validData = {
                email: 'test@example.com',
                password: 'P@ssw0rd!#$%&'
            };

            const [error, dto] = LoginUserDto.login(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.password).toBe('P@ssw0rd!#$%&');
        });
    });
});
