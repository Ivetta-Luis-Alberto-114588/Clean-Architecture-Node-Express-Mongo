import { UpdateCityDto } from "../../../../src/domain/dtos/customers/update-city.dto";
import { CityEntity } from "../../../../src/domain/entities/customers/citiy";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CityRepository } from "../../../../src/domain/repositories/customers/city.repository";
import { UpdateCityUseCase } from "../../../../src/domain/use-cases/customers/update-city.use-case";

// Mock del CityRepository
class MockCityRepository implements CityRepository {
  private mockCity: CityEntity | null = null;
  private mockUpdatedCity: CityEntity | null = null;
  private mockError: Error | null = null;
  private findByIdCalled = false;
  private updateCalled = false;

  // Mock para simular diferentes respuestas
  setMockCity(city: CityEntity | null) {
    this.mockCity = city;
  }

  setMockUpdatedCity(city: CityEntity | null) {
    this.mockUpdatedCity = city;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByIdCalled(): boolean {
    return this.findByIdCalled;
  }

  wasUpdateCalled(): boolean {
    return this.updateCalled;
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

  // Implementación del método update del repositorio
  async update(id: string, updateCityDto: UpdateCityDto): Promise<CityEntity> {
    this.updateCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockUpdatedCity) {
      throw CustomError.notFound(`Ciudad con ID ${id} no encontrada`);
    }

    return this.mockUpdatedCity;
  }

  // Métodos obligatorios del CityRepository que no usaremos en estas pruebas
  async create() { return {} as CityEntity; }
  async getAll() { return []; }
  async delete() { return {} as CityEntity; }
  async findByName() { return {} as CityEntity; }
  async findByNameForCreate() { return null; }
}

describe('UpdateCityUseCase', () => {
  let mockRepository: MockCityRepository;
  let useCase: UpdateCityUseCase;

  // Ciudad mock para las pruebas
  const mockCity: CityEntity = {
    id: "123",
    name: 'Ciudad Original',
    description: 'Descripción Original',
    isActive: true
  };

  const mockUpdatedCity: CityEntity = {
    id: "123",
    name: 'Ciudad Actualizada',
    description: 'Descripción Actualizada',
    isActive: false
  };

  // DTO para actualizar la ciudad
  const updateCityData = {
    name: 'Ciudad Actualizada',
    description: 'Descripción Actualizada',
    isActive: false
  };

  const [error, updateCityDto] = UpdateCityDto.update(updateCityData);

  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !updateCityDto) {
    throw new Error(`Failed to create test UpdateCityDto: ${error}`);
  }

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockCityRepository();
    useCase = new UpdateCityUseCase(mockRepository);

    // Configurar mocks por defecto
    mockRepository.setMockCity(mockCity);
    mockRepository.setMockUpdatedCity(mockUpdatedCity);
  });

  test('should update city successfully', async () => {
    // Ejecutar el caso de uso
    const result = await useCase.execute('123', updateCityDto);

    // Verificar que los métodos fueron llamados
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
    expect(mockRepository.wasUpdateCalled()).toBe(true);

    // Verificar que se devolvió la ciudad actualizada
    expect(result).toEqual(mockUpdatedCity);
  });

  test('should throw NotFound error when city does not exist', async () => {
    // Configurar el mock para que devuelva null (ciudad no encontrada)
    mockRepository.setMockCity(null);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('999', updateCityDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('999', updateCityDto)).rejects.toThrow(/Ciudad con ID 999 no encontrada/);

    // Verificar que findById fue llamado pero update no
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
    expect(mockRepository.wasUpdateCalled()).toBe(false);
  });

  test('should propagate repository errors from findById', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en findById');
    mockRepository.setMockError(testError);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', updateCityDto)).rejects.toThrow(CustomError);

    // Usar toMatchObject para verificar el código de estado del error
    await expect(useCase.execute('123', updateCityDto)).rejects.toMatchObject({
      statusCode: 500
    });

    // Verificar que findById fue llamado pero update no
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
    expect(mockRepository.wasUpdateCalled()).toBe(false);
  });

  test('should propagate repository errors from update', async () => {
    // Configuramos un comportamiento especial para esta prueba
    const originalFindById = mockRepository.findById.bind(mockRepository);
    const originalUpdate = mockRepository.update.bind(mockRepository);
    let findByIdCalled = false;

    // Override del método findById para que funcione normalmente
    mockRepository.findById = async (id: string) => {
      findByIdCalled = true;
      return mockCity;
    };

    // Override del método update para que lance un error
    mockRepository.update = async (id: string, dto: UpdateCityDto) => {
      throw new Error('Error de prueba en update');
    };

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', updateCityDto)).rejects.toThrow(CustomError);

    // Usar toMatchObject para verificar el código de estado del error
    await expect(useCase.execute('123', updateCityDto)).rejects.toMatchObject({
      statusCode: 500
    });

    // Verificamos que se llamaron ambos métodos
    expect(findByIdCalled).toBe(true);

    // Restauramos los métodos originales
    mockRepository.findById = originalFindById;
    mockRepository.update = originalUpdate;
  });

  test('should propagate CustomError from repository', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockRepository.setMockError(customError);

    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute('123', updateCityDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', updateCityDto)).rejects.toThrow('Error personalizado de prueba');

    // Verificar que findById fue llamado pero update no
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
    expect(mockRepository.wasUpdateCalled()).toBe(false);
  });
});