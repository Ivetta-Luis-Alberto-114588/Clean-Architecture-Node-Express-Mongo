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
const controller_auth_1 = require("../../../src/presentation/auth/controller.auth");
const custom_error_1 = require("../../../src/domain/errors/custom.error");
const test_utils_1 = require("../../utils/test-utils");
// Mock manual de los casos de uso
const mockExecute = jest.fn();
jest.mock('../../../src/domain/use-cases/auth/register-user.use-case', () => {
    return {
        RegisterUserUseCase: jest.fn().mockImplementation(() => ({
            execute: mockExecute
        }))
    };
});
jest.mock('../../../src/domain/use-cases/auth/login-user.use-case', () => {
    return {
        LoginUserUseCase: jest.fn().mockImplementation(() => ({
            execute: mockExecute
        }))
    };
});
// Importar después de los mocks
const register_user_use_case_1 = require("../../../src/domain/use-cases/auth/register-user.use-case");
const login_user_use_case_1 = require("../../../src/domain/use-cases/auth/login-user.use-case");
describe('AuthController', () => {
    // Mock del AuthRepository
    const mockAuthRepository = {
        register: jest.fn(),
        login: jest.fn()
    };
    // Instancia del controlador a probar
    let authController;
    // Datos de prueba
    const validRegisterData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    };
    const validLoginData = {
        email: 'test@example.com',
        password: 'password123'
    };
    // Usuario de respuesta simulado
    const mockUserResponse = {
        user: {
            id: 'test-id',
            name: 'test user',
            email: 'test@example.com',
            password: 'hashed_password',
            role: ['USER_ROLE'],
            token: 'mock-jwt-token'
        }
    };
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.clearAllMocks();
        mockExecute.mockClear();
        authController = new controller_auth_1.AuthController(mockAuthRepository);
        // Configurar el comportamiento por defecto del mock execute
        mockExecute.mockResolvedValue(mockUserResponse);
    });
    describe('registerUser', () => {
        // Prueba de registro exitoso
        test('should register a user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: validRegisterData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            authController.registerUser(req, res);
            // Verificar que se llamó RegisterUserUseCase correctamente
            expect(register_user_use_case_1.RegisterUserUseCase).toHaveBeenCalledWith(mockAuthRepository);
            // Esperar a que se complete la promesa
            yield new Promise(process.nextTick);
            // Verificar que se llamó al método execute con los datos correctos
            expect(mockExecute).toHaveBeenCalled();
            // Verificar que se respondió correctamente
            expect(res.json).toHaveBeenCalledWith(mockUserResponse);
            expect(res.status).not.toHaveBeenCalled();
        }));
        // Prueba de datos de registro inválidos
        test('should return 400 when register data is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Datos inválidos (sin email)
            const invalidData = {
                name: 'Test User',
                password: 'password123'
            };
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: invalidData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            authController.registerUser(req, res);
            // Verificaciones
            expect(register_user_use_case_1.RegisterUserUseCase).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
        }));
        // Prueba de manejo de errores del caso de uso
        test('should handle use case errors', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simular un error en el caso de uso
            const customError = custom_error_1.CustomError.badRequest('Email already exists');
            mockExecute.mockRejectedValueOnce(customError);
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: validRegisterData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            authController.registerUser(req, res);
            // Esperar a que se complete la promesa
            yield new Promise(process.nextTick);
            // Verificaciones
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Email already exists' });
        }));
    });
    describe('loginUser', () => {
        // Prueba de login exitoso
        test('should login a user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: validLoginData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            authController.loginUser(req, res);
            // Esperar a que se complete la promesa
            yield new Promise(process.nextTick);
            // Verificaciones
            expect(login_user_use_case_1.LoginUserUseCase).toHaveBeenCalledWith(mockAuthRepository);
            expect(mockExecute).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockUserResponse);
            expect(res.status).not.toHaveBeenCalled();
        }));
        // Prueba de datos de login inválidos
        test('should return 400 when login data is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Datos inválidos (sin email)
            const invalidData = {
                password: 'password123'
            };
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: invalidData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            authController.loginUser(req, res);
            // Verificaciones
            expect(login_user_use_case_1.LoginUserUseCase).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
        }));
        // Prueba de manejo de errores del caso de uso
        test('should handle use case errors during login', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simular un error en el caso de uso
            const customError = custom_error_1.CustomError.unauthorized('Invalid credentials');
            mockExecute.mockRejectedValueOnce(customError);
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: validLoginData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            authController.loginUser(req, res);
            // Esperar a que se complete la promesa
            yield new Promise(process.nextTick);
            // Verificaciones
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
        }));
    });
});
