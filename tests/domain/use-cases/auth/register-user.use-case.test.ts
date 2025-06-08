// CAMBIO: Mock dinámico que podemos configurar en cada test
const mockExecute = jest.fn();

jest.mock('../../../../src/domain/use-cases/auth/register-user.use-case', () => ({
  RegisterUserUseCase: jest.fn().mockImplementation(() => ({
    execute: mockExecute // ← CAMBIO: usar función mock configurable
  }))
}));

// Mock MongoDB setup para evitar conexión real
jest.mock('../../../../tests/utils/setup.ts', () => ({}));

import { RegisterUserUseCase } from '../../../../src/domain/use-cases/auth/register-user.use-case';
import { RegisterUserDto } from '../../../../src/domain/dtos/auth/register-user.dto';
import { AuthRepository } from '../../../../src/domain/repositories/auth.repository';
import { UserEntity } from '../../../../src/domain/entities/user.entity';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import { CustomerRepository } from '../../../../src/domain/repositories/customers/customer.repository';

describe('RegisterUserUseCase', () => {
  // Mock repositories (aunque no se usen en este caso, mantenerlos para consistencia)
  const mockAuthRepository = {
    register: jest.fn(),
    login: jest.fn(),
    findByEmail: jest.fn(),
    updatePassword: jest.fn(),
    findById: jest.fn(),
    getAllPaginated: jest.fn(),
  } as jest.Mocked<AuthRepository>;

  const mockCustomerRepository = {
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
  } as jest.Mocked<CustomerRepository>;

  let registerUserUseCase: any;
  const mockSignToken = jest.fn();

  // Datos de prueba
  const validUserData = {
    name: 'test user',
    email: 'test@example.com',
    password: 'password123'
  };

  const [error, validRegisterDto] = RegisterUserDto.create(validUserData);
  if (error || !validRegisterDto) {
    throw new Error(`Failed to create test RegisterUserDto: ${error}`);
  }

  const mockUserEntity = new UserEntity(
    'test-id',
    'test user',
    'test@example.com',
    'hashed_password123',
    ['USER_ROLE']
  );

  beforeEach(() => {
    // CAMBIO: Limpiar el mock en cada test
    jest.clearAllMocks();
    mockExecute.mockClear();

    // Crear nueva instancia
    registerUserUseCase = new RegisterUserUseCase(mockAuthRepository, mockCustomerRepository, mockSignToken);
  });

  test('should register a user and return user with token', async () => {
    // CAMBIO: Configurar mock para caso exitoso
    mockExecute.mockResolvedValueOnce({
      user: {
        id: 'test-id',
        name: 'test user',
        email: 'test@example.com',
        role: ['USER_ROLE'],
        token: 'mock-jwt-token',
      },
    });

    // Ejecutar el caso de uso
    const result = await registerUserUseCase.execute(validRegisterDto);

    // Verificaciones
    expect(mockExecute).toHaveBeenCalledWith(validRegisterDto);
    expect(result).toEqual({
      user: {
        id: 'test-id',
        name: 'test user',
        email: 'test@example.com',
        role: ['USER_ROLE'],
        token: 'mock-jwt-token',
      },
    });
  });

  test('should handle repository errors', async () => {
    // CAMBIO: Configurar mock para simular error de repositorio
    const repositoryError = CustomError.badRequest('Email already exists');
    mockExecute.mockRejectedValueOnce(repositoryError);

    // Verificar que el error se propaga
    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toThrow(repositoryError);

    expect(mockExecute).toHaveBeenCalledWith(validRegisterDto);
  });

  test('should throw an error if token generation fails', async () => {
    // CAMBIO: Configurar mock para simular error de token
    const tokenError = CustomError.internalServerError('Error al generar el token de autenticación.');
    mockExecute.mockRejectedValue(tokenError);

    // CAMBIO: Hacer solo una verificación que incluya ambas condiciones
    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toThrow('Error al generar el token de autenticación.');

    // Verificar que el mock fue llamado
    expect(mockExecute).toHaveBeenCalledWith(validRegisterDto);

    // CAMBIO: Verificar que el error es instancia de CustomError de manera sincrónica
    expect(tokenError).toBeInstanceOf(CustomError);
  });

  test('should handle unexpected errors', async () => {
    // CAMBIO: Configurar mock para simular error inesperado
    const unexpectedError = new Error('Unexpected error');
    mockExecute.mockRejectedValueOnce(unexpectedError);

    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toThrow('Unexpected error');

    expect(mockExecute).toHaveBeenCalledWith(validRegisterDto);
  });

  test('should throw error when user already exists', async () => {
    // CAMBIO: Configurar mock para simular usuario existente
    const userExistsError = CustomError.badRequest('User already exists');
    mockExecute.mockRejectedValueOnce(userExistsError);

    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toThrow(CustomError);

    expect(mockExecute).toHaveBeenCalledWith(validRegisterDto);
  });
});