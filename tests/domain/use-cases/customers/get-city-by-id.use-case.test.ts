import { CityEntity } from "../../../../src/domain/entities/customers/citiy";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CityRepository } from "../../../../src/domain/repositories/customers/city.repository";
import { GetCityByIdUseCase } from "../../../../src/domain/use-cases/customers/get-city-by-id..use-case";


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

describe('GetCityByIdUseCase', () => {
  let mockRepository: MockCityRepository;
  let useCase: GetCityByIdUseCase;
  
  // Ciudad mock para las pruebas
  const mockCity: CityEntity = {
    id: 123,
    name: 'Ciudad Test',
    description: 'Descripción Test',
    isActive: true
  };

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockCityRepository();
    useCase = new GetCityByIdUseCase(mockRepository);
  });

  test('should get city by id successfully', async () => {
    // Configurar el mock para devolver una ciudad válida
    mockRepository.setMockCity(mockCity);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute('123');
    
    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
    
    // Verificar que se devolvió la ciudad correctamente
    expect(result).toEqual(mockCity);
  });

  test('should throw NotFound error when city does not exist', async () => {
    // Configurar el mock para que devuelva null (ciudad no encontrada)
    mockRepository.setMockCity(null);
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    await expect(useCase.execute('123')).rejects.toThrow(/Ciudad con ID 123 no encontrada/);
    
    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    
    // Usar toMatchObject para verificar el código de estado del error
    // en lugar de depender del mensaje exacto
    await expect(useCase.execute('123')).rejects.toMatchObject({
      statusCode: 500
    });
    
    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
  });

  test('should propagate CustomError from repository', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockRepository.setMockError(customError);
    
    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    await expect(useCase.execute('123')).rejects.toThrow('Error personalizado de prueba');
    
    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
  });
});