// tests/domain/use-cases/customers/create-city.use-case.test.ts
import { CreateCityUseCase } from '../../../../src/domain/use-cases/customers/create-city.use-case';
import { CreateCityDto } from '../../../../src/domain/dtos/customers/create-city.dto';
import { CityRepository } from '../../../../src/domain/repositories/customers/city.repository';
import { CityEntity } from '../../../../src/domain/entities/customers/citiy';
import { PaginationDto } from '../../../../src/domain/dtos/shared/pagination.dto';
import { CustomError } from '../../../../src/domain/errors/custom.error';

describe('CreateCityUseCase', () => {
  // Mock del CityRepository
  const mockCityRepository: jest.Mocked<CityRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByName: jest.fn(),
    findByNameForCreate: jest.fn()
  };

  // Inicialización del caso de uso a probar
  let createCityUseCase: CreateCityUseCase;

  // Datos de prueba
  const validCityData = {
    name: 'Buenos Aires',
    description: 'Capital de Argentina',
    isActive: true
  };

  // Crear el DTO usando el método estático create
  const [error, validCreateCityDto] = CreateCityDto.create(validCityData);

  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !validCreateCityDto) {
    throw new Error(`Failed to create test CreateCityDto: ${error}`);
  }

  // Ciudad de respuesta simulada
  const mockCityEntity = new CityEntity(
    "1", // ID de ciudad
    'buenos aires',
    'capital de argentina',
    true
  );

  // PaginationDto mock para las pruebas
  const mockPaginationDto = { page: 1, limit: 1 } as PaginationDto;

  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.resetAllMocks();
    createCityUseCase = new CreateCityUseCase(mockCityRepository);

    // Configurar el comportamiento por defecto de los mocks
    mockCityRepository.findByNameForCreate.mockResolvedValue(null); // La ciudad no existe
    mockCityRepository.create.mockResolvedValue(mockCityEntity);

    // Mock para PaginationDto.create
    jest.spyOn(PaginationDto, 'create').mockReturnValue([undefined, mockPaginationDto]);
  });

  // Prueba del flujo exitoso
  test('should create a city successfully', async () => {
    // Ejecutar el caso de uso
    const result = await createCityUseCase.execute(validCreateCityDto);

    // Verificaciones
    expect(mockCityRepository.findByNameForCreate).toHaveBeenCalledWith(
      validCreateCityDto.name,
      mockPaginationDto
    );
    expect(mockCityRepository.create).toHaveBeenCalledWith(validCreateCityDto);
    expect(result).toEqual(mockCityEntity);
  });

  // Prueba de validación: nombre demasiado corto
  test('should throw an error if name is too short', async () => {
    // Datos de prueba con nombre demasiado corto
    const createCityDtoWithShortName = { ...validCreateCityDto, name: 'AB' }; // menos de 3 caracteres

    // Verificar que se lanza el error adecuado
    await expect(createCityUseCase.execute(createCityDtoWithShortName))
      .rejects
      .toThrow(CustomError);

    await expect(createCityUseCase.execute(createCityDtoWithShortName))
      .rejects
      .toThrow('City name must have at least 3 characters');

    // Verificar que no se ejecutaron otros métodos del repositorio
    expect(mockCityRepository.findByNameForCreate).not.toHaveBeenCalled();
    expect(mockCityRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de ciudad ya existente
  test('should throw an error if city already exists', async () => {
    // Simular que la ciudad ya existe
    mockCityRepository.findByNameForCreate.mockResolvedValue(mockCityEntity);

    // Verificar que se lanza el error adecuado
    await expect(createCityUseCase.execute(validCreateCityDto))
      .rejects
      .toThrow(CustomError);

    await expect(createCityUseCase.execute(validCreateCityDto))
      .rejects
      .toThrow('City with this name already exists');

    // Verificar que no se intentó crear la ciudad
    expect(mockCityRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de error en la paginación
  test('should handle pagination error', async () => {
    // Simular un error en PaginationDto.create
    jest.spyOn(PaginationDto, 'create').mockReturnValue(['Pagination error', undefined]);

    // Verificar que se lanza el error adecuado
    await expect(createCityUseCase.execute(validCreateCityDto))
      .rejects
      .toThrow(CustomError);

    // Verificar que no se ejecutaron otros métodos del repositorio
    expect(mockCityRepository.findByNameForCreate).not.toHaveBeenCalled();
    expect(mockCityRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de manejo de errores del repositorio
  test('should handle repository errors', async () => {
    // Simular un error en el repositorio
    const repositoryError = new Error('Database connection error');
    mockCityRepository.findByNameForCreate.mockRejectedValue(repositoryError);

    // Verificar que el error se transforma en un CustomError
    await expect(createCityUseCase.execute(validCreateCityDto))
      .rejects
      .toBeInstanceOf(CustomError);

    await expect(createCityUseCase.execute(validCreateCityDto))
      .rejects
      .toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('create-city-use-case')
      });
  });

  // Prueba de error específico del dominio
  test('should handle custom domain errors', async () => {
    // Simular un error específico del dominio
    const domainError = CustomError.badRequest('Invalid city data');
    mockCityRepository.findByNameForCreate.mockRejectedValue(domainError);

    // Verificar que el error se propaga sin cambios
    await expect(createCityUseCase.execute(validCreateCityDto))
      .rejects
      .toThrow(domainError);
  });
});