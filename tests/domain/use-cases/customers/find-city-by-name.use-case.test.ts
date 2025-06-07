import { PaginationDto } from "../../../../src/domain/dtos/shared/pagination.dto";
import { CityEntity } from "../../../../src/domain/entities/customers/citiy";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CityRepository } from "../../../../src/domain/repositories/customers/city.repository";
import { FindCityByNameUseCase } from "../../../../src/domain/use-cases/customers/find-city-by-name.use-case";

// Mock del CityRepository
class MockCityRepository implements CityRepository {
  private mockCity: CityEntity | null = null;
  private mockError: Error | null = null;
  private findByNameCalled = false;

  // Mock para simular diferentes respuestas
  setMockCity(city: CityEntity | null) {
    this.mockCity = city;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByNameCalled(): boolean {
    return this.findByNameCalled;
  }

  // Implementación del método findByName del repositorio
  async findByName(name: string, paginationDto: PaginationDto): Promise<CityEntity> {
    this.findByNameCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockCity) {
      throw CustomError.notFound(`Ciudad con nombre ${name} no encontrada`);
    }

    return this.mockCity;
  }

  // Métodos obligatorios del CityRepository que no usaremos en estas pruebas
  async create() { return {} as CityEntity; }
  async getAll() { return []; }
  async findById() { return {} as CityEntity; }
  async update() { return {} as CityEntity; }
  async delete() { return {} as CityEntity; }
  async findByNameForCreate() { return null; }
}

describe('FindCityByNameUseCase', () => {
  let mockRepository: MockCityRepository;
  let useCase: FindCityByNameUseCase;
  let paginationDto: PaginationDto;

  // Ciudad mock para las pruebas
  const mockCity: CityEntity = {
    id: "123",
    name: 'Ciudad Test',
    description: 'Descripción Test',
    isActive: true
  };

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockCityRepository();
    useCase = new FindCityByNameUseCase(mockRepository);

    // Crear un PaginationDto válido (asumiendo que el constructor es accesible)
    const [error, pagination] = PaginationDto.create(1, 10);
    expect(error).toBeUndefined();
    paginationDto = pagination!;
  });

  test('should find city by name successfully', async () => {
    // Configurar el mock para devolver una ciudad válida
    mockRepository.setMockCity(mockCity);

    // Ejecutar el caso de uso
    const result = await useCase.execute('Ciudad Test', paginationDto);

    // Verificar que el método findByName fue llamado
    expect(mockRepository.wasFindByNameCalled()).toBe(true);

    // Verificar que se devolvió la ciudad correctamente
    expect(result).toEqual(mockCity);
  });

  test('should use default pagination when none is provided', async () => {
    // Configurar el mock para devolver una ciudad válida
    mockRepository.setMockCity(mockCity);

    // Espiar el método create de PaginationDto
    const spyCreate = jest.spyOn(PaginationDto, 'create');

    // Ejecutar el caso de uso sin proporcionar paginación (pasando undefined)
    const result = await useCase.execute('Ciudad Test', undefined as unknown as PaginationDto);

    // Verificar que se creó una paginación por defecto
    expect(spyCreate).toHaveBeenCalledWith(1, 5);

    // Verificar que el método findByName fue llamado
    expect(mockRepository.wasFindByNameCalled()).toBe(true);

    // Verificar que se devolvió la ciudad correctamente
    expect(result).toEqual(mockCity);

    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should throw NotFound error when city does not exist', async () => {
    // Configurar el mock para que devuelva null (ciudad no encontrada)
    mockRepository.setMockCity(null);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('Ciudad Inexistente', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('Ciudad Inexistente', paginationDto)).rejects.toThrow(/Ciudad.*no encontrada/);

    // Verificar que el método findByName fue llamado
    expect(mockRepository.wasFindByNameCalled()).toBe(true);
  });

  test('should throw BadRequest when pagination is invalid', async () => {
    // Configurar el mock para devolver una ciudad válida
    mockRepository.setMockCity(mockCity);

    // Espiar el método create de PaginationDto para que devuelva un error
    const spyCreate = jest.spyOn(PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);

    // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
    await expect(useCase.execute('Ciudad Test', undefined as unknown as PaginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('Ciudad Test', undefined as unknown as PaginationDto)).rejects.toThrow('Error de paginación');

    // Verificar que el método findByName NO fue llamado (porque falló antes)
    expect(mockRepository.wasFindByNameCalled()).toBe(false);

    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow(/error interno del servidor/);

    // Verificar que el método findByName fue llamado
    expect(mockRepository.wasFindByNameCalled()).toBe(true);
  });

  test('should propagate CustomError from repository', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockRepository.setMockError(customError);

    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow('Error personalizado de prueba');

    // Verificar que el método findByName fue llamado
    expect(mockRepository.wasFindByNameCalled()).toBe(true);
  });
});