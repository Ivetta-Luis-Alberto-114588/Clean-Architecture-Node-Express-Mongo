import { PaginationDto } from "../../../../src/domain/dtos/shared/pagination.dto";
import { NeighborhoodEntity } from "../../../../src/domain/entities/customers/neighborhood";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { NeighborhoodRepository } from "../../../../src/domain/repositories/customers/neighborhood.repository";
import { GetAllNeighborhoodsUseCase } from "../../../../src/domain/use-cases/customers/get-all-neighborhoods.use-case";


// Mock del NeighborhoodRepository
class MockNeighborhoodRepository implements NeighborhoodRepository {
  private mockNeighborhoods: NeighborhoodEntity[] = [];
  private mockError: Error | null = null;
  private getAllCalled = false;

  // Mock para simular diferentes respuestas
  setMockNeighborhoods(neighborhoods: NeighborhoodEntity[]) {
    this.mockNeighborhoods = neighborhoods;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasGetAllCalled(): boolean {
    return this.getAllCalled;
  }

  // Implementación del método getAll del repositorio
  async getAll(paginationDto: PaginationDto): Promise<NeighborhoodEntity[]> {
    this.getAllCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    return this.mockNeighborhoods;
  }

  // Métodos obligatorios del NeighborhoodRepository que no usaremos en estas pruebas
  async create() { return {} as NeighborhoodEntity; }
  async findById() { return {} as NeighborhoodEntity; }
  async update() { return {} as NeighborhoodEntity; }
  async delete() { return {} as NeighborhoodEntity; }
  async findByName() { return {} as NeighborhoodEntity; }
  async findByNameForCreate() { return null; }
  async findByCity() { return []; }
}

describe('GetAllNeighborhoodsUseCase', () => {
  let mockRepository: MockNeighborhoodRepository;
  let useCase: GetAllNeighborhoodsUseCase;
  let paginationDto: PaginationDto;

  // Datos mock para las pruebas
  const mockCity = {
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
    },
    {
      id: "123",
      name: 'Barrio Test 3',
      description: 'Descripción Test 3',
      city: mockCity,
      isActive: false
    }
  ];

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockNeighborhoodRepository();
    useCase = new GetAllNeighborhoodsUseCase(mockRepository);

    // Crear un PaginationDto válido
    const [error, pagination] = PaginationDto.create(1, 10);
    expect(error).toBeUndefined();
    paginationDto = pagination!;
  });

  test('should get all neighborhoods successfully', async () => {
    // Configurar el mock para devolver barrios
    mockRepository.setMockNeighborhoods(mockNeighborhoods);

    // Ejecutar el caso de uso
    const result = await useCase.execute(paginationDto);

    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);

    // Verificar que se devolvieron los barrios correctamente
    expect(result).toEqual(mockNeighborhoods);
    expect(result.length).toBe(3);
  });

  test('should return empty array when no neighborhoods found', async () => {
    // Configurar el mock para devolver un array vacío
    mockRepository.setMockNeighborhoods([]);

    // Ejecutar el caso de uso
    const result = await useCase.execute(paginationDto);

    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);

    // Verificar que se devuelve un array vacío
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should use default pagination when none is provided', async () => {
    // Configurar el mock para devolver barrios
    mockRepository.setMockNeighborhoods(mockNeighborhoods);

    // Espiar el método create de PaginationDto
    const spyCreate = jest.spyOn(PaginationDto, 'create');

    // Ejecutar el caso de uso sin proporcionar paginación
    const result = await useCase.execute(undefined as unknown as PaginationDto);

    // Verificar que se creó una paginación por defecto
    expect(spyCreate).toHaveBeenCalledWith(1, 5);

    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);

    // Verificar que se devolvieron los barrios correctamente
    expect(result).toEqual(mockNeighborhoods);

    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should throw BadRequest when pagination is invalid', async () => {
    // Espiar el método create de PaginationDto para que devuelva un error
    const spyCreate = jest.spyOn(PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);

    // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
    await expect(useCase.execute(undefined as unknown as PaginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute(undefined as unknown as PaginationDto)).rejects.toThrow('Error de paginación');

    // Verificar que el método getAll NO fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(false);

    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute(paginationDto)).rejects.toThrow(CustomError);

    // Verificar el código de estado sin depender del mensaje exacto
    await expect(useCase.execute(paginationDto)).rejects.toMatchObject({
      statusCode: 500
    });

    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
  });

  test('should propagate CustomError from repository', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockRepository.setMockError(customError);

    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute(paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute(paginationDto)).rejects.toThrow('Error personalizado de prueba');

    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
  });
});