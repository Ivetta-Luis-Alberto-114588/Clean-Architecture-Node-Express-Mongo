// tests/domain/use-cases/customers/create-neighborhood.use-case.test.ts
import { CreateNeighborhoodUseCase } from '../../../../src/domain/use-cases/customers/create-neighborhood.use-case';
import { CreateNeighborhoodDto } from '../../../../src/domain/dtos/customers/create-neighborhood.dto';
import { NeighborhoodRepository } from '../../../../src/domain/repositories/customers/neighborhood.repository';
import { CityRepository } from '../../../../src/domain/repositories/customers/city.repository';
import { NeighborhoodEntity } from '../../../../src/domain/entities/customers/neighborhood';
import { CityEntity } from '../../../../src/domain/entities/customers/citiy';
import { PaginationDto } from '../../../../src/domain/dtos/shared/pagination.dto';
import { CustomError } from '../../../../src/domain/errors/custom.error';
import mongoose from 'mongoose';

describe('CreateNeighborhoodUseCase', () => {
  // Mocks de los repositorios
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
  let createNeighborhoodUseCase: CreateNeighborhoodUseCase;

  // Datos de prueba
  const validCityId = new mongoose.Types.ObjectId().toString();

  const validNeighborhoodData = {
    name: 'Palermo',
    description: 'Barrio turístico',
    cityId: validCityId,
    isActive: true
  };

  // Crear el DTO usando el método estático create
  const [error, validCreateNeighborhoodDto] = CreateNeighborhoodDto.create(validNeighborhoodData);

  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !validCreateNeighborhoodDto) {
    throw new Error(`Failed to create test CreateNeighborhoodDto: ${error}`);
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
    'palermo',
    'barrio turístico',
    mockCity,
    true
  );

  // PaginationDto mock para las pruebas
  const mockPaginationDto = { page: 1, limit: 1 } as PaginationDto;

  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.resetAllMocks();
    createNeighborhoodUseCase = new CreateNeighborhoodUseCase(
      mockNeighborhoodRepository,
      mockCityRepository
    );

    // Configurar el comportamiento por defecto de los mocks
    mockCityRepository.findById.mockResolvedValue(mockCity);
    mockNeighborhoodRepository.findByNameForCreate.mockResolvedValue(null); // El barrio no existe
    mockNeighborhoodRepository.create.mockResolvedValue(mockNeighborhood);

    // Mock para PaginationDto.create
    jest.spyOn(PaginationDto, 'create').mockReturnValue([undefined, mockPaginationDto]);
  });

  // Prueba del flujo exitoso
  test('should create a neighborhood successfully', async () => {
    // Ejecutar el caso de uso
    const result = await createNeighborhoodUseCase.execute(validCreateNeighborhoodDto);

    // Verificaciones
    expect(mockCityRepository.findById).toHaveBeenCalledWith(validCityId);
    expect(mockNeighborhoodRepository.findByNameForCreate).toHaveBeenCalledWith(
      validCreateNeighborhoodDto.name,
      validCityId,
      mockPaginationDto
    );
    expect(mockNeighborhoodRepository.create).toHaveBeenCalledWith(validCreateNeighborhoodDto);
    expect(result).toEqual(mockNeighborhood);
  });

  // Prueba de validación: nombre demasiado corto
  test('should throw an error if name is too short', async () => {
    // Datos de prueba con nombre demasiado corto
    const createNeighborhoodDtoWithShortName = { ...validCreateNeighborhoodDto, name: 'Pa' }; // menos de 3 caracteres

    // Verificar que se lanza el error adecuado
    await expect(createNeighborhoodUseCase.execute(createNeighborhoodDtoWithShortName))
      .rejects
      .toThrow(CustomError);

    await expect(createNeighborhoodUseCase.execute(createNeighborhoodDtoWithShortName))
      .rejects
      .toThrow('El nombre del barrio debe tener al menos 3 caracteres');

    // Verificar que no se ejecutaron otros métodos del repositorio
    expect(mockCityRepository.findById).not.toHaveBeenCalled();
    expect(mockNeighborhoodRepository.findByNameForCreate).not.toHaveBeenCalled();
    expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de ciudad no encontrada
  test('should throw an error if city is not found', async () => {
    // Simular que la ciudad no existe
    mockCityRepository.findById.mockRejectedValue(
      CustomError.notFound('City not found')
    );

    // Verificar que se lanza el error adecuado
    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toThrow(CustomError);

    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toThrow('City not found');

    // Verificar que no se intentó crear el barrio
    expect(mockNeighborhoodRepository.findByNameForCreate).not.toHaveBeenCalled();
    expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de barrio duplicado
  test('should throw an error if neighborhood already exists in city', async () => {
    // Simular que ya existe un barrio con ese nombre en la ciudad
    mockNeighborhoodRepository.findByNameForCreate.mockResolvedValue(mockNeighborhood);

    // Verificar que se lanza el error adecuado
    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toThrow(CustomError);

    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toThrow('Ya existe un barrio con este nombre en esta ciudad');

    // Verificar que no se intentó crear el barrio
    expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de error en la paginación
  test('should handle pagination error', async () => {
    // Simular un error en PaginationDto.create
    jest.spyOn(PaginationDto, 'create').mockReturnValue(['Pagination error', undefined]);

    // Ejecutar el caso de uso y verificar que maneja el error del DTO
    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toThrow(CustomError);

    // La ciudad debería verificarse primero antes de llegar a la paginación
    expect(mockCityRepository.findById).toHaveBeenCalled();

    // Pero no se debería intentar buscar o crear el barrio
    expect(mockNeighborhoodRepository.findByNameForCreate).not.toHaveBeenCalled();
    expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
  });

  // Prueba de manejo de errores del repositorio
  test('should handle repository errors', async () => {
    // Simular un error en el repositorio de barrios
    const repositoryError = new Error('Database connection error');
    mockNeighborhoodRepository.create.mockRejectedValue(repositoryError);

    // Verificar que el error se transforma en un CustomError
    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toBeInstanceOf(CustomError);

    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('create-neighborhood-use-case')
      });
  });

  // Prueba de error específico del dominio
  test('should handle custom domain errors', async () => {
    // Simular un error específico del dominio
    const domainError = CustomError.badRequest('Invalid neighborhood data');
    mockNeighborhoodRepository.create.mockRejectedValue(domainError);

    // Verificar que el error se propaga sin cambios
    await expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
      .rejects
      .toThrow(domainError);
  });
});