import { RegisterUserDto } from '../../../../src/domain/dtos/auth/register-user.dto';

describe('RegisterUserDto', () => {
  // Prueba de creación exitosa
  test('should create a valid DTO with correct values', () => {
    // Datos de prueba válidos
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    // Creación del DTO
    const [error, registerUserDto] = RegisterUserDto.create(userData);
    
    // Verificaciones
    expect(error).toBeUndefined();
    expect(registerUserDto).toBeInstanceOf(RegisterUserDto);
    
    // Verificar valores correctos y transformaciones
    expect(registerUserDto?.name).toBe('test user'); // debe estar en minúsculas
    expect(registerUserDto?.email).toBe('test@example.com');
    expect(registerUserDto?.password).toBe('password123');
  });
  
  // Prueba de validación: nombre requerido
  test('should return error if name is not provided', () => {
    // Datos de prueba con nombre faltante
    const userData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    // Creación del DTO
    const [error, registerUserDto] = RegisterUserDto.create(userData);
    
    // Verificaciones
    expect(error).toBe('name is required');
    expect(registerUserDto).toBeUndefined();
  });
  
  // Prueba de validación: email requerido
  test('should return error if email is not provided', () => {
    // Datos de prueba con email faltante
    const userData = {
      name: 'Test User',
      password: 'password123'
    };
    
    // Creación del DTO
    const [error, registerUserDto] = RegisterUserDto.create(userData);
    
    // Verificaciones
    expect(error).toBe('email is required');
    expect(registerUserDto).toBeUndefined();
  });
  
  // Prueba de validación: formato de email
  test('should return error if email format is invalid', () => {
    // Datos de prueba con email inválido
    const userData = {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123'
    };
    
    // Creación del DTO
    const [error, registerUserDto] = RegisterUserDto.create(userData);
    
    // Verificaciones
    expect(error).toBe('email is not valid');
    expect(registerUserDto).toBeUndefined();
  });
  
  // Prueba de validación: contraseña requerida
  test('should return error if password is not provided', () => {
    // Datos de prueba con contraseña faltante
    const userData = {
      name: 'Test User',
      email: 'test@example.com'
    };
    
    // Creación del DTO
    const [error, registerUserDto] = RegisterUserDto.create(userData);
    
    // Verificaciones
    expect(error).toBe('password is required');
    expect(registerUserDto).toBeUndefined();
  });
  
  // Prueba de validación: longitud de contraseña
  test('should return error if password is too short', () => {
    // Datos de prueba con contraseña demasiado corta
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: '12345' // menos de 6 caracteres
    };
    
    // Creación del DTO
    const [error, registerUserDto] = RegisterUserDto.create(userData);
    
    // Verificaciones
    expect(error).toBe('password too short');
    expect(registerUserDto).toBeUndefined();
  });
});