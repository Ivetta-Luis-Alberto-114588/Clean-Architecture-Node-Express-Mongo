// tests/domain/use-cases/customers/create-customer.use-case.test.ts
import { CreateCustomerUseCase } from '../../../../src/domain/use-cases/customers/create-customer.use-case';
import { CreateCustomerDto } from '../../../../src/domain/dtos/customers/create-customer.dto';
import { CustomerRepository } from '../../../../src/domain/repositories/customers/customer.repository';
import { NeighborhoodRepository } from '../../../../src/domain/repositories/customers/neighborhood.repository';
import { CustomerEntity } from '../../../../src/domain/entities/customers/customer';
import { NeighborhoodEntity } from '../../../../src/domain/entities/customers/neighborhood';
import { CityEntity } from '../../../../src/domain/entities/customers/citiy';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import mongoose from 'mongoose';

describe('CreateCustomerUseCase', () => {
  // Mocks de los repositorios
  const mockCustomerRepository: jest.Mocked<CustomerRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByEmail: jest.fn(),
    findByNeighborhood: jest.fn(),
    findByUserId: jest.fn(),
    // Métodos de dirección
    createAddress: jest.fn(),
    getAddressesByCustomerId: jest.fn(),
    findAddressById: jest.fn(),
    updateAddress: jest.fn(),
    deleteAddress: jest.fn(),
    setDefaultAddress: jest.fn()

  };

  const mockNeighborhoodRepository: jest.Mocked<NeighborhoodRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByName: jest.fn(),
    findByNameForCreate: jest.fn(),
    findByCity: jest.fn()
  };

  // Inicialización del caso de uso a probar
  let createCustomerUseCase: CreateCustomerUseCase;

  // Datos de prueba
  const validNeighborhoodId = new mongoose.Types.ObjectId().toString();

  const validCustomerData = {
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    phone: '+5491123456789',
    address: 'Av. Corrientes 1234',
    neighborhoodId: validNeighborhoodId,
    isActive: true
  };

  // Crear el DTO usando el método estático create
  const [error, validCreateCustomerDto] = CreateCustomerDto.create(validCustomerData);

  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !validCreateCustomerDto) {
    throw new Error(`Failed to create test CreateCustomerDto: ${error}`);
  }

  // Mocks de entidades para las pruebas
  const mockCity = new CityEntity(
    "1",
    'Buenos Aires',
    'Capital de Argentina',
    true
  );

  const mockNeighborhood = new NeighborhoodEntity(
    "2",
    'Palermo',
    'Barrio turístico',
    mockCity,
    true
  );

  const mockCustomerEntity = new CustomerEntity(
    "3",
    'juan pérez',
    'juan.perez@example.com',
    '+5491123456789',
    'av. corrientes 1234',
    mockNeighborhood,
    true
  );

  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.resetAllMocks();
    createCustomerUseCase = new CreateCustomerUseCase(
      mockCustomerRepository,
      mockNeighborhoodRepository
    );

    // Configurar el comportamiento por defecto de los mocks
    mockNeighborhoodRepository.findById.mockResolvedValue(mockNeighborhood);
    mockCustomerRepository.findByEmail.mockResolvedValue(null); // El cliente no existe
    mockCustomerRepository.create.mockResolvedValue(mockCustomerEntity);
  });

  // Prueba del flujo exitoso
  test('should create a customer successfully', async () => {
    // Ejecutar el caso de uso
    const result = await createCustomerUseCase.execute(validCreateCustomerDto);

    // Verificaciones
    expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(validNeighborhoodId);
    expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(validCreateCustomerDto.email);
    expect(mockCustomerRepository.create).toHaveBeenCalledWith(validCreateCustomerDto);
    expect(result).toEqual(mockCustomerEntity);
  });

  // Prueba de validación: nombre demasiado corto
  test('should throw an error if name is too short', async () => {
    // Datos de prueba con nombre demasiado corto
    const createCustomerDtoWithShortName = { ...validCreateCustomerDto, name: 'Ju' }; // menos de 3 caracteres

    // Verificar que se lanza el error adecuado
    await expect(createCustomerUseCase.execute(createCustomerDtoWithShortName))
      .rejects
      .toThrow(CustomError);

    await expect(createCustomerUseCase.execute(createCustomerDtoWithShortName))
      .rejects
      .toThrow('El nombre del cliente debe tener al menos 3 caracteres');

    // Verificar que no se ejecutaron otros métodos del repositorio
    expect(mockNeighborhoodRepository.findById).not.toHaveBeenCalled();
    expect(mockCustomerRepository.findByEmail).not.toHaveBeenCalled();
    expect(mockCustomerRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de barrio no encontrado
  test('should throw an error if neighborhood is not found', async () => {
    // Simular que el barrio no existe
    mockNeighborhoodRepository.findById.mockRejectedValue(
      CustomError.notFound('Neighborhood not found')
    );

    // Verificar que se lanza el error adecuado
    await expect(createCustomerUseCase.execute(validCreateCustomerDto))
      .rejects
      .toThrow(CustomError);

    await expect(createCustomerUseCase.execute(validCreateCustomerDto))
      .rejects
      .toThrow('Neighborhood not found');

    // Verificar que no se intentó crear el cliente
    expect(mockCustomerRepository.findByEmail).not.toHaveBeenCalled();
    expect(mockCustomerRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de email duplicado
  test('should throw an error if email already exists', async () => {
    // Simular que ya existe un cliente con ese email
    mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomerEntity);

    // Verificar que se lanza el error adecuado
    await expect(createCustomerUseCase.execute(validCreateCustomerDto))
      .rejects
      .toThrow(CustomError);

    await expect(createCustomerUseCase.execute(validCreateCustomerDto))
      .rejects
      .toThrow('Ya existe un cliente con este email');

    // Verificar que no se intentó crear el cliente
    expect(mockCustomerRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de manejo de errores del repositorio
  test('should handle repository errors', async () => {
    // Simular un error en el repositorio de clientes
    const repositoryError = new Error('Database connection error');
    mockCustomerRepository.create.mockRejectedValue(repositoryError);

    // Verificar que el error se transforma en un CustomError
    await expect(createCustomerUseCase.execute(validCreateCustomerDto))
      .rejects
      .toBeInstanceOf(CustomError);

    await expect(createCustomerUseCase.execute(validCreateCustomerDto))
      .rejects
      .toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('create-customer-use-case')
      });
  });

  // Prueba de error específico del dominio
  test('should handle custom domain errors', async () => {
    // Simular un error específico del dominio
    const domainError = CustomError.badRequest('Invalid customer data');
    mockNeighborhoodRepository.findById.mockRejectedValue(domainError);

    // Verificar que el error se propaga sin cambios
    await expect(createCustomerUseCase.execute(validCreateCustomerDto))
      .rejects
      .toThrow(domainError);
  });
});