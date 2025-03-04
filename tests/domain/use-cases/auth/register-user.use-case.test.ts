import { RegisterUserUseCase } from '../../../../src/domain/use-cases/auth/register-user.use-case';
import { RegisterUserDto } from '../../../../src/domain/dtos/auth/register-user.dto';
import { AuthRepository } from '../../../../src/domain/repositories/auth.repository';
import { UserEntity } from '../../../../src/domain/entities/user.entity';
import { CustomError } from '../../../../src/domain/errors/custom.error';

describe('RegisterUserUseCase', () => {
  // Mock del AuthRepository
  const mockAuthRepository: jest.Mocked<AuthRepository> = {
    register: jest.fn(),
    login: jest.fn(),
  };
  
  // Mock para el método de generación de tokens
  const mockSignToken = jest.fn();
  
  // Inicialización del caso de uso a probar
  let registerUserUseCase: RegisterUserUseCase;
  
  // Datos de prueba
  const validUserData = {
    name: 'test user',
    email: 'test@example.com',
    password: 'password123'
  };
  
  // Crear el DTO usando el método estático create (que es la forma correcta)
  const [error, validRegisterDto] = RegisterUserDto.create(validUserData);
  
  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !validRegisterDto) {
    throw new Error(`Failed to create test RegisterUserDto: ${error}`);
  }
  
  // Usuario de respuesta simulado
  const mockUserEntity = new UserEntity(
    'test-id',
    'test user',
    'test@example.com',
    'hashed_password123',
    ['USER_ROLE']
  );
  
  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.resetAllMocks();
    registerUserUseCase = new RegisterUserUseCase(mockAuthRepository, mockSignToken);
    
    // Configurar el comportamiento por defecto de los mocks
    mockAuthRepository.register.mockResolvedValue(mockUserEntity);
    mockSignToken.mockResolvedValue('mock-jwt-token');
  });
  
  // Prueba del flujo exitoso
  test('should register a user and return user with token', async () => {
    // Ejecutar el caso de uso
    const result = await registerUserUseCase.execute(validRegisterDto);
    
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
  });
  
  // Prueba de manejo de error del repositorio
  test('should handle repository errors', async () => {
    // Simular error en el repositorio
    const repositoryError = new CustomError(400, 'Email already exists');
    mockAuthRepository.register.mockRejectedValue(repositoryError);
    
    // Verificar que el error se propaga
    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toThrow(repositoryError);
  });
  
  // Prueba de error en la generación del token
  test('should throw an error if token generation fails', async () => {
    // Simular fallo en la generación del token
    mockSignToken.mockResolvedValue(null);
    
    // Verificar que se lanza el error adecuado
    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toThrow(CustomError);
    
    // Verificar el mensaje de error específico
    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toThrow('register-use-case, Error generating token');
  });
  
  // Prueba de manejo de errores inesperados
  test('should handle unexpected errors', async () => {
    // Simular un error inesperado
    mockAuthRepository.register.mockRejectedValue(new Error('Unexpected error'));
    
    // Verificar que se transforma en un CustomError con statusCode 500
    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toBeInstanceOf(CustomError);
    
    await expect(registerUserUseCase.execute(validRegisterDto))
      .rejects
      .toMatchObject({
        statusCode: 500,
        message: 'register-use-case, internal server error'
      });
  });
});