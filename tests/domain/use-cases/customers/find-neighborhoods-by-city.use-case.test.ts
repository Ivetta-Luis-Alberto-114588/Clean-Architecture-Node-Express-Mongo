import { PaginationDto } from "../../../../src/domain/dtos/shared/pagination.dto";
import { CityEntity } from "../../../../src/domain/entities/customers/citiy";
import { NeighborhoodEntity } from "../../../../src/domain/entities/customers/neighborhood";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CityRepository } from "../../../../src/domain/repositories/customers/city.repository";
import { NeighborhoodRepository } from "../../../../src/domain/repositories/customers/neighborhood.repository";
import { FindNeighborhoodsByCityUseCase } from "../../../../src/domain/use-cases/customers/find-neighborhoods-by-city.use-case";


// Mock del NeighborhoodRepository
class MockNeighborhoodRepository implements NeighborhoodRepository {
  private mockNeighborhoods: NeighborhoodEntity[] = [];
  private mockError: Error | null = null;
  private findByCityCalled = false;

  // Mock para simular diferentes respuestas
  setMockNeighborhoods(neighborhoods: NeighborhoodEntity[]) {
    this.mockNeighborhoods = neighborhoods;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByCityCalled(): boolean {
    return this.findByCityCalled;
  }

  // Implementación del método findByCity del repositorio
  async findByCity(cityId: string, paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
    this.findByCityCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    return this.mockNeighborhoods;
  }

  // Métodos obligatorios del NeighborhoodRepository que no usaremos en estas pruebas
  async create() { return {} as NeighborhoodEntity; }
  async getAll() { return []; }
  async findById() { return {} as NeighborhoodEntity; }
  async update() { return {} as NeighborhoodEntity; }
  async delete() { return {} as NeighborhoodEntity; }
  async findByName() { return {} as NeighborhoodEntity; }
  async findByNameForCreate() { return null; }
}

// Mock del CityRepository
class MockCityRepository implements CityRepository {
  private mockCity: CityEntity | null = null;
  private mockError: Error | null = null;
  private findByIdCalled = false;

  // Mock para simular diferentes respuestas
  setMockCity(city: CityEntity | null) {
    this.mockCity = city;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByIdCalled(): boolean {
    return this.findByIdCalled;
  }

  // Implementación del método findById del repositorio
  async findById(id: string): Promise<CityEntity> {
    this.findByIdCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockCity) {
      throw CustomError.notFound(`Ciudad con ID ${id} no encontrada`);
    }

    return this.mockCity;
  }

  // Métodos obligatorios del CityRepository que no usaremos en estas pruebas
  async create() { return {} as CityEntity; }
  async getAll() { return []; }
  async update() { return {} as CityEntity; }
  async delete() { return {} as CityEntity; }
  async findByName() { return {} as CityEntity; }
  async findByNameForCreate() { return null; }
}

describe('FindNeighborhoodsByCityUseCase', () => {
  let mockNeighborhoodRepository: MockNeighborhoodRepository;
  let mockCityRepository: MockCityRepository;
  let useCase: FindNeighborhoodsByCityUseCase;
  let paginationDto: PaginationDto;

  // Datos mock para las pruebas
  const mockCity: CityEntity = {
    id: "123",
    name: 'Ciudad Test',
    description: 'Descripción Test',
    isActive: true
  };

  const mockNeighborhoods: NeighborhoodEntity[] = [
    {
      id: "456",
      name: 'Barrio Test 1',
      description: 'Descripción Test 1',
      city: mockCity,
      isActive: true
    },
    {
      id: "789",
      name: 'Barrio Test 2',
      description: 'Descripción Test 2',
      city: mockCity,
      isActive: true
    }
  ];

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockNeighborhoodRepository = new MockNeighborhoodRepository();
    mockCityRepository = new MockCityRepository();
    useCase = new FindNeighborhoodsByCityUseCase(
      mockNeighborhoodRepository,
      mockCityRepository
    );

    // Crear un PaginationDto válido
    const [error, pagination] = PaginationDto.create(1, 10);
    expect(error).toBeUndefined();
    paginationDto = pagination!;
  });

  test('should find neighborhoods by city successfully', async () => {
    // Configurar los mocks para devolver datos válidos
    mockCityRepository.setMockCity(mockCity);
    mockNeighborhoodRepository.setMockNeighborhoods(mockNeighborhoods);

    // Ejecutar el caso de uso
    const result = await useCase.execute('123', paginationDto);

    // Verificar que los métodos fueron llamados
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
    expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);

    // Verificar que se devolvieron los barrios correctamente
    expect(result).toEqual(mockNeighborhoods);
    expect(result.length).toBe(2);
  });

  test('should return empty array when no neighborhoods found', async () => {
    // Configurar los mocks: ciudad existe pero no hay barrios
    mockCityRepository.setMockCity(mockCity);
    mockNeighborhoodRepository.setMockNeighborhoods([]);

    // Ejecutar el caso de uso
    const result = await useCase.execute('123', paginationDto);

    // Verificar que los métodos fueron llamados
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
    expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);

    // Verificar que se devuelve un array vacío
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should use default pagination when none is provided', async () => {
    // Configurar los mocks para devolver datos válidos
    mockCityRepository.setMockCity(mockCity);
    mockNeighborhoodRepository.setMockNeighborhoods(mockNeighborhoods);

    // Espiar el método create de PaginationDto
    const spyCreate = jest.spyOn(PaginationDto, 'create');

    // Ejecutar el caso de uso sin proporcionar paginación
    const result = await useCase.execute('123', undefined as unknown as PaginationDto);

    // Verificar que se creó una paginación por defecto
    expect(spyCreate).toHaveBeenCalledWith(1, 5);

    // Verificar que los métodos fueron llamados
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
    expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);

    // Verificar que se devolvieron los barrios correctamente
    expect(result).toEqual(mockNeighborhoods);

    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should throw NotFound error when city does not exist', async () => {
    // Configurar el mock para que devuelva null (ciudad no encontrada)
    mockCityRepository.setMockCity(null);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(/Ciudad con ID 123 no encontrada/);

    // Verificar que el método findById fue llamado
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);

    // Verificar que el método findByCity NO fue llamado
    expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(false);
  });

  test('should throw BadRequest when pagination is invalid', async () => {
    // Configurar los mocks para devolver datos válidos
    mockCityRepository.setMockCity(mockCity);

    // Espiar el método create de PaginationDto para que devuelva un error
    const spyCreate = jest.spyOn(PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);

    // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
    await expect(useCase.execute('123', undefined as unknown as PaginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', undefined as unknown as PaginationDto)).rejects.toThrow('Error de paginación');

    // Verificar que el método findById SÍ fue llamado
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);

    // Verificar que el método findByCity NO fue llamado
    expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(false);

    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should propagate city repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio de ciudades');
    mockCityRepository.setMockError(testError);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);

    // Verificar que el método findById fue llamado
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);

    // Verificar que el método findByCity NO fue llamado
    expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(false);
  });

  test('should propagate neighborhood repository errors', async () => {
    // Configurar los mocks: ciudad existe pero el repositorio de barrios da error
    mockCityRepository.setMockCity(mockCity);
    mockNeighborhoodRepository.setMockError(new Error('Error de prueba en el repositorio de barrios'));

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);

    // Verificar que el método findById fue llamado
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);

    // Verificar que el método findByCity también fue llamado
    expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);
  });

  test('should propagate CustomError from repositories', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockCityRepository.setMockError(customError);

    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow('Error personalizado de prueba');

    // Verificar que el método findById fue llamado
    expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
  });
});