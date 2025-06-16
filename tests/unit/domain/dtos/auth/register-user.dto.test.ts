// tests/unit/domain/dtos/auth/register-user.dto.test.ts
import { RegisterUserDto } from '../../../../../src/domain/dtos/auth/register-user.dto';

describe('RegisterUserDto', () => {
    describe('create', () => {
        it('should create valid DTO when all required fields are provided', () => {
            const validData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.name).toBe('john doe'); // Should be lowercase
            expect(dto!.email).toBe('john@example.com'); // Should be lowercase
            expect(dto!.password).toBe('password123');
        });

        it('should convert name and email to lowercase', () => {
            const validData = {
                name: 'JOHN DOE',
                email: 'JOHN@EXAMPLE.COM',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.name).toBe('john doe');
            expect(dto!.email).toBe('john@example.com');
        });

        it('should return error when name is missing', () => {
            const invalidData = {
                email: 'john@example.com',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('name is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when name is null', () => {
            const invalidData = {
                name: null,
                email: 'john@example.com',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('name is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when name is empty string', () => {
            const invalidData = {
                name: '',
                email: 'john@example.com',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('name is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is missing', () => {
            const invalidData = {
                name: 'John Doe',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is null', () => {
            const invalidData = {
                name: 'John Doe',
                email: null,
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when email is empty string', () => {
            const invalidData = {
                name: 'John Doe',
                email: '',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when email format is invalid', () => {
            const invalidData = {
                name: 'John Doe',
                email: 'invalid-email',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('email is not valid');
            expect(dto).toBeUndefined();
        });

        it('should return error when password is missing', () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com'
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('password is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when password is null', () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: null
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('password is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when password is empty string', () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: ''
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('password is required');
            expect(dto).toBeUndefined();
        });

        it('should return error when password is too short', () => {
            const invalidData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '12345' // 5 characters, less than 6
            };

            const [error, dto] = RegisterUserDto.create(invalidData);

            expect(error).toBeDefined();
            expect(error).toBe('password too short');
            expect(dto).toBeUndefined();
        });

        it('should accept password with exactly 6 characters', () => {
            const validData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: '123456' // Exactly 6 characters
            };

            const [error, dto] = RegisterUserDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.password).toBe('123456');
        });

        it('should accept valid email with special characters', () => {
            const validData = {
                name: 'John Doe',
                email: 'john.doe-123@example-domain.co.uk',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.email).toBe('john.doe-123@example-domain.co.uk');
        });

        it('should handle long passwords', () => {
            const validData = {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'ThisIsAVeryLongPasswordWithMoreThan20Characters!'
            };

            const [error, dto] = RegisterUserDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.password).toBe('ThisIsAVeryLongPasswordWithMoreThan20Characters!');
        }); it('should handle names with special characters', () => {
            const validData = {
                name: 'José María',
                email: 'jose@example.com',
                password: 'password123'
            };

            const [error, dto] = RegisterUserDto.create(validData);

            expect(error).toBeUndefined();
            expect(dto).toBeDefined();
            expect(dto!.name).toBe('josé maría');
        });
    });
});
