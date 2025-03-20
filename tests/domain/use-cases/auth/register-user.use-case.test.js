"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const register_user_use_case_1 = require("../../../../src/domain/use-cases/auth/register-user.use-case");
const register_user_dto_1 = require("../../../../src/domain/dtos/auth/register-user.dto");
const user_entity_1 = require("../../../../src/domain/entities/user.entity");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
describe('RegisterUserUseCase', () => {
    // Mock del AuthRepository
    const mockAuthRepository = {
        register: jest.fn(),
        login: jest.fn(),
    };
    // Mock para el método de generación de tokens
    const mockSignToken = jest.fn();
    // Inicialización del caso de uso a probar
    let registerUserUseCase;
    // Datos de prueba
    const validUserData = {
        name: 'test user',
        email: 'test@example.com',
        password: 'password123'
    };
    // Crear el DTO usando el método estático create (que es la forma correcta)
    const [error, validRegisterDto] = register_user_dto_1.RegisterUserDto.create(validUserData);
    // Verificar que no hay error y el DTO se creó correctamente
    if (error || !validRegisterDto) {
        throw new Error(`Failed to create test RegisterUserDto: ${error}`);
    }
    // Usuario de respuesta simulado
    const mockUserEntity = new user_entity_1.UserEntity('test-id', 'test user', 'test@example.com', 'hashed_password123', ['USER_ROLE']);
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.resetAllMocks();
        registerUserUseCase = new register_user_use_case_1.RegisterUserUseCase(mockAuthRepository, mockSignToken);
        // Configurar el comportamiento por defecto de los mocks
        mockAuthRepository.register.mockResolvedValue(mockUserEntity);
        mockSignToken.mockResolvedValue('mock-jwt-token');
    });
    // Prueba del flujo exitoso
    test('should register a user and return user with token', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield registerUserUseCase.execute(validRegisterDto);
        // Verificaciones
        expect(mockAuthRepository.register).toHaveBeenCalledWith(validRegisterDto);
        expect(mockSignToken).toHaveBeenCalledWith({ id: mockUserEntity.id }, '2h');
        expect(result).toEqual({
            user: {
                id: mockUserEntity.id,
                name: mockUserEntity.name,
                email: mockUserEntity.email,
                password: mockUserEntity.password,
                role: mockUserEntity.role,
                token: 'mock-jwt-token',
            },
        });
    }));
    // Prueba de manejo de error del repositorio
    test('should handle repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular error en el repositorio
        const repositoryError = new custom_error_1.CustomError(400, 'Email already exists');
        mockAuthRepository.register.mockRejectedValue(repositoryError);
        // Verificar que el error se propaga
        yield expect(registerUserUseCase.execute(validRegisterDto))
            .rejects
            .toThrow(repositoryError);
    }));
    // Prueba de error en la generación del token
    test('should throw an error if token generation fails', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular fallo en la generación del token
        mockSignToken.mockResolvedValue(null);
        // Verificar que se lanza el error adecuado
        yield expect(registerUserUseCase.execute(validRegisterDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        // Verificar el mensaje de error específico
        yield expect(registerUserUseCase.execute(validRegisterDto))
            .rejects
            .toThrow('register-use-case, Error generating token');
    }));
    // Prueba de manejo de errores inesperados
    test('should handle unexpected errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error inesperado
        mockAuthRepository.register.mockRejectedValue(new Error('Unexpected error'));
        // Verificar que se transforma en un CustomError con statusCode 500
        yield expect(registerUserUseCase.execute(validRegisterDto))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield expect(registerUserUseCase.execute(validRegisterDto))
            .rejects
            .toMatchObject({
            statusCode: 500,
            message: 'register-use-case, internal server error'
        });
    }));
});
