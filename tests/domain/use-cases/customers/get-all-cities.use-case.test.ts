import { PaginationDto } from "../../../../src/domain/dtos/shared/pagination.dto";
import { CityEntity } from "../../../../src/domain/entities/customers/citiy";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CityRepository } from "../../../../src/domain/repositories/customers/city.repository";
import { GetAllCitiesUseCase } from "../../../../src/domain/use-cases/customers/get-all-cities.use-case";


// Mock del CityRepository
class MockCityRepository implements CityRepository {
  private mockCities: CityEntity[] = [];
  private mockError: Error | null = null;
  private getAllCalled = false;

  // Mock para simular diferentes respuestas
  setMockCities(cities: CityEntity[]) {
    this.mockCities = cities;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasGetAllCalled(): boolean {
    return this.getAllCalled;
  }

  // Implementación del método getAll del repositorio
  async getAll(paginationDto: PaginationDto): Promise<CityEntity[]> {
    this.getAllCalled = true;
    
    if (this.mockError) {
      throw this.mockError;
    }
    
    return this.mockCities;
  }

  // Métodos obligatorios del CityRepository que no usaremos en estas pruebas
  async create() { return {} as CityEntity; }
  async findById() { return {} as CityEntity; }
  async update() { return {} as CityEntity; }
  async delete() { return {} as CityEntity; }
  async findByName() { return {} as CityEntity; }
  async findByNameForCreate() { return null; }
}

describe('GetAllCitiesUseCase', () => {
  let mockRepository: MockCityRepository;
  let useCase: GetAllCitiesUseCase;
  let paginationDto: PaginationDto;
  
  // Datos mock para las pruebas
  const mockCities: CityEntity[] = [
    {
      id: 123,
      name: 'Ciudad Test 1',
      description: 'Descripción Test 1',
      isActive: true
    },
    {
      id: 456,
      name: 'Ciudad Test 2',
      description: 'Descripción Test 2',
      isActive: true
    },
    {
      id: 789,
      name: 'Ciudad Test 3',
      description: 'Descripción Test 3',
      isActive: false
    }
  ];

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockCityRepository();
    useCase = new GetAllCitiesUseCase(mockRepository);
    
    // Crear un PaginationDto válido
    const [error, pagination] = PaginationDto.create(1, 10);
    expect(error).toBeUndefined();
    paginationDto = pagination!;
  });

  test('should get all cities successfully', async () => {
    // Configurar el mock para devolver ciudades
    mockRepository.setMockCities(mockCities);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute(paginationDto);
    
    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
    
    // Verificar que se devolvieron las ciudades correctamente
    expect(result).toEqual(mockCities);
    expect(result.length).toBe(3);
  });

  test('should return empty array when no cities found', async () => {
    // Configurar el mock para devolver un array vacío
    mockRepository.setMockCities([]);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute(paginationDto);
    
    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
    
    // Verificar que se devuelve un array vacío
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should use default pagination when none is provided', async () => {
    // Configurar el mock para devolver ciudades
    mockRepository.setMockCities(mockCities);
    
    // Espiar el método create de PaginationDto
    const spyCreate = jest.spyOn(PaginationDto, 'create');
    
    // Ejecutar el caso de uso sin proporcionar paginación
    const result = await useCase.execute(undefined as unknown as PaginationDto);
    
    // Verificar que se creó una paginación por defecto
    expect(spyCreate).toHaveBeenCalledWith(1, 5);
    
    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
    
    // Verificar que se devolvieron las ciudades correctamente
    expect(result).toEqual(mockCities);
    
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
    await expect(useCase.execute(paginationDto)).rejects.toThrow(/error interno del servidor/);
    
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