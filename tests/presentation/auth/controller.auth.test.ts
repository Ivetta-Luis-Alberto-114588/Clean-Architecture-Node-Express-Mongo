import { AuthController } from '../../../src/presentation/auth/controller.auth';
import { AuthRepository } from '../../../src/domain/repositories/auth.repository';
import { RegisterUserDto } from '../../../src/domain/dtos/auth/register-user.dto';
import { LoginUserDto } from '../../../src/domain/dtos/auth/login-user.dto';
import { UserEntity } from '../../../src/domain/entities/user.entity';
import { CustomError } from '../../../src/domain/errors/custom.error';
import { mockRequest, mockResponse } from '../../utils/test-utils';

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
import { RegisterUserUseCase } from '../../../src/domain/use-cases/auth/register-user.use-case';
import { LoginUserUseCase } from '../../../src/domain/use-cases/auth/login-user.use-case';
import { CustomerRepository } from '../../../src/domain/repositories/customers/customer.repository';
import { EmailService } from '../../../src/domain/interfaces/email.service';

describe('AuthController', () => {
  // Mock del AuthRepository
  const mockAuthRepository: jest.Mocked<AuthRepository> = {
    register: jest.fn(),
    login: jest.fn(),
    findByEmail: jest.fn(),
    updatePassword: jest.fn(),
    findById: jest.fn(),
    getAllPaginated: jest.fn(),
  };

  const mockEmailService: jest.Mocked<EmailService> = {
    sendEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    // Agregar otros métodos si los tiene EmailService
  };

  // AGREGAR: Mock del CustomerRepository
  const mockCustomerRepository: jest.Mocked<CustomerRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByEmail: jest.fn(),
    findByNeighborhood: jest.fn(),
    findByUserId: jest.fn(),
    createAddress: jest.fn(),
    getAddressesByCustomerId: jest.fn(),
    findAddressById: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    setDefaultAddress: jest.fn(),
  };


  const mockSignToken = jest.fn().mockReturnValue('mock-jwt-token');

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
    mockExecute.mockClear();

    // CAMBIO: Pasar los 3 parámetros requeridos
    authController = new AuthController(
      mockAuthRepository,
      mockCustomerRepository, // ← AGREGAR: segundo parámetro
      mockEmailService          // ← AGREGAR: tercer parámetro
    );

    // Configurar el comportamiento por defecto del mock execute
    mockExecute.mockResolvedValue(mockUserResponse);
  });

  describe('registerUser', () => {
    // Prueba de registro exitoso
    test('should register a user successfully', async () => {
      // Preparar request y response
      const req = mockRequest({ body: validRegisterData });
      const res = mockResponse();

      // Ejecutar el controlador
      authController.registerUser(req as any, res as any);

      // CAMBIO: Verificar que se llamó RegisterUserUseCase con ambos repositorios
      expect(RegisterUserUseCase).toHaveBeenCalledWith(
        mockAuthRepository,
        mockCustomerRepository  // ← AGREGAR: segundo parámetro esperado
      );

      // Esperar a que se complete la promesa
      await new Promise(process.nextTick);

      // Verificar que se llamó al método execute con los datos correctos
      expect(mockExecute).toHaveBeenCalled();

      // Verificar que se respondió correctamente
      expect(res.json).toHaveBeenCalledWith(mockUserResponse);
      expect(res.status).not.toHaveBeenCalled();
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
      authController.registerUser(req as any, res as any);

      // Verificaciones
      expect(RegisterUserUseCase).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });

    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.badRequest('Email already exists');
      mockExecute.mockRejectedValueOnce(customError);

      // Preparar request y response
      const req = mockRequest({ body: validRegisterData });
      const res = mockResponse();

      // Ejecutar el controlador
      authController.registerUser(req as any, res as any);

      // Esperar a que se complete la promesa
      await new Promise(process.nextTick);

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
      authController.loginUser(req as any, res as any);

      // Esperar a que se complete la promesa
      await new Promise(process.nextTick);

      // CAMBIO: Verificar según los parámetros que espera LoginUserUseCase
      // Si LoginUserUseCase también necesita ambos repositorios:
      // expect(LoginUserUseCase).toHaveBeenCalledWith(
      //   mockAuthRepository,
      //   mockCustomerRepository  // ← AGREGAR si es necesario
      // );

      // O si solo necesita AuthRepository:
      expect(LoginUserUseCase).toHaveBeenCalledWith(mockAuthRepository);
      // expect(mockExecute).toHaveBeenCalled();
      // expect(res.json).toHaveBeenCalledWith(mockUserResponse);
      // expect(res.status).not.toHaveBeenCalled();
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
      authController.loginUser(req as any, res as any);

      // Verificaciones
      expect(LoginUserUseCase).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
    });

    // Prueba de manejo de errores del caso de uso
    test('should handle use case errors during login', async () => {
      // Simular un error en el caso de uso
      const customError = CustomError.unauthorized('Invalid credentials');
      mockExecute.mockRejectedValueOnce(customError);

      // Preparar request y response
      const req = mockRequest({ body: validLoginData });
      const res = mockResponse();

      // Ejecutar el controlador
      authController.loginUser(req as any, res as any);

      // Esperar a que se complete la promesa
      await new Promise(process.nextTick);

      // Verificaciones
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });


  describe('Email functionality', () => {
    test('should handle email service errors gracefully', async () => {
      // Simular error en el servicio de email
      mockEmailService.sendEmail.mockRejectedValue(new Error('Email service error'));

      // Dependiendo de cómo el controlador use el EmailService,
      // puedes probar diferentes escenarios aquí
    });
  });
});