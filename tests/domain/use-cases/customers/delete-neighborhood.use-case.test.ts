import { NeighborhoodEntity } from "../../../../src/domain/entities/customers/neighborhood";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { NeighborhoodRepository } from "../../../../src/domain/repositories/customers/neighborhood.repository";
import { DeleteNeighborhoodUseCase } from "../../../../src/domain/use-cases/customers/delete-neighborhood.use-case";

// Mock del NeighborhoodRepository
class MockNeighborhoodRepository implements NeighborhoodRepository {
  private mockNeighborhood: NeighborhoodEntity | null = null;
  private mockError: Error | null = null;
  private deleteCalled = false;

  // Mock para simular diferentes respuestas
  setMockNeighborhood(neighborhood: NeighborhoodEntity | null) {
    this.mockNeighborhood = neighborhood;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasDeleteCalled(): boolean {
    return this.deleteCalled;
  }

  // Implementación del método findById del repositorio
  async findById(id: string): Promise<NeighborhoodEntity> {
    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockNeighborhood) {
      throw CustomError.notFound("Barrio no encontrado");
    }

    return this.mockNeighborhood;
  }

  // Implementación del método delete del repositorio
  async delete(id: string): Promise<NeighborhoodEntity> {
    this.deleteCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockNeighborhood) {
      throw CustomError.notFound("Barrio no encontrado");
    }

    return this.mockNeighborhood;
  }

  // Métodos obligatorios del NeighborhoodRepository que no usaremos en estas pruebas
  async create() { return {} as NeighborhoodEntity; }
  async getAll() { return []; }
  async update() { return {} as NeighborhoodEntity; }
  async findByName() { return {} as NeighborhoodEntity; }
  async findByNameForCreate() { return null; }
  async findByCity() { return []; }
}

describe('DeleteNeighborhoodUseCase', () => {
  let mockRepository: MockNeighborhoodRepository;
  let useCase: DeleteNeighborhoodUseCase;

  // Barrio mock para las pruebas
  const mockNeighborhood: NeighborhoodEntity = {
    id: "123",
    name: 'Barrio Test',
    description: 'Descripción Test',
    city: {
      id: "456",
      name: 'Ciudad Test',
      description: 'Descripción Test',
      isActive: true
    },
    isActive: true
  };

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockNeighborhoodRepository();
    useCase = new DeleteNeighborhoodUseCase(mockRepository);
  });

  test('should delete neighborhood successfully', async () => {
    // Configurar el mock para devolver un barrio válido
    mockRepository.setMockNeighborhood(mockNeighborhood);

    // Ejecutar el caso de uso
    const result = await useCase.execute('123');

    // Verificar que el método delete fue llamado
    expect(mockRepository.wasDeleteCalled()).toBe(true);

    // Verificar que se devolvió el barrio eliminado correctamente
    expect(result).toEqual(mockNeighborhood);
  });

  test('should throw NotFound error when neighborhood does not exist', async () => {
    // Configurar el mock para que devuelva null (barrio no encontrado)
    mockRepository.setMockNeighborhood(null);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    await expect(useCase.execute('123')).rejects.toThrow(/Barrio no encontrado/);

    // Verificar que el método delete NO fue llamado
    expect(mockRepository.wasDeleteCalled()).toBe(false);
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    await expect(useCase.execute('123')).rejects.toThrow(/error interno del servidor/);
  });

  test('should propagate CustomError from repository', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockRepository.setMockError(customError);

    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    await expect(useCase.execute('123')).rejects.toThrow('Error personalizado de prueba');
  });
});