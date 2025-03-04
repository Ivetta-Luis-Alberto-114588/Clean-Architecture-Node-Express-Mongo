import { AuthController } from '../../../src/presentation/auth/controller.auth';
import { AuthRepository } from '../../../src/domain/repositories/auth.repository';
import { RegisterUserDto } from '../../../src/domain/dtos/auth/register-user.dto';
import { LoginUserDto } from '../../../src/domain/dtos/auth/login-user.dto';
import { UserEntity } from '../../../src/domain/entities/user.entity';
import { CustomError } from '../../../src/domain/errors/custom.error';
import { mockRequest, mockResponse } from '../../utils/test-utils';

// Mock completo del módulo de los casos de uso para controlar su comportamiento
jest.mock('../../../src/domain/use-cases/auth/register-user.use-case', () => {
  return {
    RegisterUserUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn()
    }))
  };
});

jest.mock('../../../src/domain/use-cases/auth/login-user.use-case', () => {
  return {
    LoginUserUseCase: jest.fn().mockImplementation(() => ({
      execute: jest.fn()
    }))
  };
});

// Importar después de los mocks
import { RegisterUserUseCase } from '../../../src/domain/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '../../../src/domain/use-cases/auth/login-user.use-case';

describe('AuthController', () => {
  // Mock del AuthRepository
  const mockAuthRepository: jest.Mocked<AuthRepository> = {
    register: jest.fn(),
    login: jest.fn()
  };
  
  // Instancia del controlador a probar
  let authController: AuthController;
  
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
    authController = new AuthController(mockAuthRepository);
    
    // Configurar el comportamiento por defecto de los casos de uso
    (RegisterUserUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(mockUserResponse)
    }));
    
    (LoginUserUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(mockUserResponse)
    }));
  });
  
  describe('registerUser', () => {
    // Prueba de registro exitoso
    test('should register a user successfully', async () => {
      // Preparar request y response
      const req = mockRequest({ body: validRegisterData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await authController.registerUser(req as any, res as any);
      
      // Verificaciones
      expect(RegisterUserUseCase).toHaveBeenCalledWith(mockAuthRepository);
      expect(res.json).toHaveBeenCalledWith(mockUserResponse);
      expect(res.status).not.toHaveBeenCalled(); // No se debe cambiar el status en caso de éxito
    });
    
    // Prueba de datos de registro inválidos
    test('should return 400 when register data is invalid', async () => {
      // Datos inválidos (sin email)
      const invalidData = {
        name: 'Test User',
        password: 'password123'
      };
      
      // Preparar request y response
      const req = mockRequest({ body: invalidData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await authController.registerUser(req as any, res as any);
      
      // Verificaciones
      expect(RegisterUserUseCase).not.toHaveBeenCalled(); // No debe llegar a crear el caso de uso
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
    
    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.badRequest('Email already exists');
      (RegisterUserUseCase as jest.Mock).mockImplementation(() => ({
        execute: jest.fn().mockRejectedValue(customError)
      }));
      
      // Preparar request y response
      const req = mockRequest({ body: validRegisterData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await authController.registerUser(req as any, res as any);
      
      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already exists' });
    });
  });
  
  describe('loginUser', () => {
    // Prueba de login exitoso
    test('should login a user successfully', async () => {
      // Preparar request y response
      const req = mockRequest({ body: validLoginData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await authController.loginUser(req as any, res as any);
      
      // Verificaciones
      expect(LoginUserUseCase).toHaveBeenCalledWith(mockAuthRepository);
      expect(res.json).toHaveBeenCalledWith(mockUserResponse);
      expect(res.status).not.toHaveBeenCalled(); // No se debe cambiar el status en caso de éxito
    });
    
    // Prueba de datos de login inválidos
    test('should return 400 when login data is invalid', async () => {
      // Datos inválidos (sin email)
      const invalidData = {
        password: 'password123'
      };
      
      // Preparar request y response
      const req = mockRequest({ body: invalidData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await authController.loginUser(req as any, res as any);
      
      // Verificaciones
      expect(LoginUserUseCase).not.toHaveBeenCalled(); // No debe llegar a crear el caso de uso
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });
    
    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors during login', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.unauthorized('Invalid credentials');
      (LoginUserUseCase as jest.Mock).mockImplementation(() => ({
        execute: jest.fn().mockRejectedValue(customError)
      }));
      
      // Preparar request y response
      const req = mockRequest({ body: validLoginData });
      const res = mockResponse();
      
      // Ejecutar el controlador
      await authController.loginUser(req as any, res as any);
      
      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });
});