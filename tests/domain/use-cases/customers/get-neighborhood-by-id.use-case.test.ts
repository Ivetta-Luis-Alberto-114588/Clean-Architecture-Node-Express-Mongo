import { NeighborhoodEntity } from "../../../../src/domain/entities/customers/neighborhood";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { NeighborhoodRepository } from "../../../../src/domain/repositories/customers/neighborhood.repository";
import { GetNeighborhoodByIdUseCase } from "../../../../src/domain/use-cases/customers/get-neighborhood-by-id.use-case";

// Mock del NeighborhoodRepository
class MockNeighborhoodRepository implements NeighborhoodRepository {
  private mockNeighborhood: NeighborhoodEntity | null = null;
  private mockError: Error | null = null;
  private findByIdCalled = false;

  // Mock para simular diferentes respuestas
  setMockNeighborhood(neighborhood: NeighborhoodEntity | null) {
    this.mockNeighborhood = neighborhood;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByIdCalled(): boolean {
    return this.findByIdCalled;
  }

  // Implementación del método findById del repositorio
  async findById(id: string): Promise<NeighborhoodEntity> {
    this.findByIdCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockNeighborhood) {
      throw CustomError.notFound(`Barrio con ID ${id} no encontrado`);
    }

    return this.mockNeighborhood;
  }

  // Métodos obligatorios del NeighborhoodRepository que no usaremos en estas pruebas
  async create() { return {} as NeighborhoodEntity; }
  async getAll() { return []; }
  async update() { return {} as NeighborhoodEntity; }
  async delete() { return {} as NeighborhoodEntity; }
  async findByName() { return {} as NeighborhoodEntity; }
  async findByNameForCreate() { return null; }
  async findByCity() { return []; }
}

describe('GetNeighborhoodByIdUseCase', () => {
  let mockRepository: MockNeighborhoodRepository;
  let useCase: GetNeighborhoodByIdUseCase;

  // Barrio mock para las pruebas
  const mockNeighborhood: NeighborhoodEntity = {
    id: "456",
    name: 'Barrio Test',
    description: 'Descripción Test',
    city: {
      id: "123",
      name: 'Ciudad Test',
      description: 'Descripción Test',
      isActive: true
    },
    isActive: true
  };

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockNeighborhoodRepository();
    useCase = new GetNeighborhoodByIdUseCase(mockRepository);
  });

  test('should get neighborhood by id successfully', async () => {
    // Configurar el mock para devolver un barrio válido
    mockRepository.setMockNeighborhood(mockNeighborhood);

    // Ejecutar el caso de uso
    const result = await useCase.execute('456');

    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);

    // Verificar que se devolvió el barrio correctamente
    expect(result).toEqual(mockNeighborhood);
  });

  test('should throw NotFound error when neighborhood does not exist', async () => {
    // Configurar el mock para que devuelva null (barrio no encontrado)
    mockRepository.setMockNeighborhood(null);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('999')).rejects.toThrow(CustomError);
    await expect(useCase.execute('999')).rejects.toThrow(/Barrio con ID 999 no encontrado/);

    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('456')).rejects.toThrow(CustomError);

    // Usar toMatchObject para verificar el código de estado del error
    await expect(useCase.execute('456')).rejects.toMatchObject({
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
    await expect(useCase.execute('456')).rejects.toThrow(CustomError);
    await expect(useCase.execute('456')).rejects.toThrow('Error personalizado de prueba');

    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
  });
});