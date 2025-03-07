import { PaginationDto } from "../../../../src/domain/dtos/shared/pagination.dto";
import { CustomerEntity } from "../../../../src/domain/entities/customers/customer";
import { NeighborhoodEntity } from "../../../../src/domain/entities/customers/neighborhood";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CustomerRepository } from "../../../../src/domain/repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../../../src/domain/repositories/customers/neighborhood.repository";
import { FindCustomersByNeighborhoodUseCase } from "../../../../src/domain/use-cases/customers/find-customers-by-neighborhood.use-case";


// Mock del CustomerRepository
class MockCustomerRepository implements CustomerRepository {
  private mockCustomers: CustomerEntity[] = [];
  private mockError: Error | null = null;
  private findByNeighborhoodCalled = false;

  // Mock para simular diferentes respuestas
  setMockCustomers(customers: CustomerEntity[]) {
    this.mockCustomers = customers;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByNeighborhoodCalled(): boolean {
    return this.findByNeighborhoodCalled;
  }

  // Implementación del método findByNeighborhood del repositorio
  async findByNeighborhood(neighborhoodId: string, paginationDto: PaginationDto): Promise<CustomerEntity[]> {
    this.findByNeighborhoodCalled = true;
    
    if (this.mockError) {
      throw this.mockError;
    }
    
    return this.mockCustomers;
  }

  // Métodos obligatorios del CustomerRepository que no usaremos en estas pruebas
  async create() { return {} as CustomerEntity; }
  async getAll() { return []; }
  async findById() { return {} as CustomerEntity; }
  async update() { return {} as CustomerEntity; }
  async delete() { return {} as CustomerEntity; }
  async findByEmail() { return null; }
}

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

describe('FindCustomersByNeighborhoodUseCase', () => {
  let mockCustomerRepository: MockCustomerRepository;
  let mockNeighborhoodRepository: MockNeighborhoodRepository;
  let useCase: FindCustomersByNeighborhoodUseCase;
  let paginationDto: PaginationDto;
  
  // Datos mock para las pruebas
  const mockNeighborhood: NeighborhoodEntity = {
    id: 123,
    name: 'Barrio Test',
    description: 'Descripción Test',
    city: {
      id: 456,
      name: 'Ciudad Test',
      description: 'Descripción Test',
      isActive: true
    },
    isActive: true
  };
  
  const mockCustomers: CustomerEntity[] = [
    {
      id: 789,
      name: 'Cliente Test 1',
      email: 'cliente1@test.com',
      phone: '1234567890',
      address: 'Dirección Test 1',
      neighborhood: mockNeighborhood,
      isActive: true
    },
    {
      id: 123,
      name: 'Cliente Test 2',
      email: 'cliente2@test.com',
      phone: '0987654321',
      address: 'Dirección Test 2',
      neighborhood: mockNeighborhood,
      isActive: true
    }
  ];

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockCustomerRepository = new MockCustomerRepository();
    mockNeighborhoodRepository = new MockNeighborhoodRepository();
    useCase = new FindCustomersByNeighborhoodUseCase(
      mockCustomerRepository,
      mockNeighborhoodRepository
    );
    
    // Crear un PaginationDto válido
    const [error, pagination] = PaginationDto.create(1, 10);
    expect(error).toBeUndefined();
    paginationDto = pagination!;
  });

  test('should find customers by neighborhood successfully', async () => {
    // Configurar los mocks para devolver datos válidos
    mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
    mockCustomerRepository.setMockCustomers(mockCustomers);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute('123', paginationDto);
    
    // Verificar que los métodos fueron llamados
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
    
    // Verificar que se devolvieron los clientes correctamente
    expect(result).toEqual(mockCustomers);
    expect(result.length).toBe(2);
  });

  test('should return empty array when no customers found', async () => {
    // Configurar los mocks: barrio existe pero no hay clientes
    mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
    mockCustomerRepository.setMockCustomers([]);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute('123', paginationDto);
    
    // Verificar que los métodos fueron llamados
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
    
    // Verificar que se devuelve un array vacío
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should use default pagination when none is provided', async () => {
    // Configurar los mocks para devolver datos válidos
    mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
    mockCustomerRepository.setMockCustomers(mockCustomers);
    
    // Espiar el método create de PaginationDto
    const spyCreate = jest.spyOn(PaginationDto, 'create');
    
    // Ejecutar el caso de uso sin proporcionar paginación
    const result = await useCase.execute('123', undefined as unknown as PaginationDto);
    
    // Verificar que se creó una paginación por defecto
    expect(spyCreate).toHaveBeenCalledWith(1, 5);
    
    // Verificar que los métodos fueron llamados
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
    
    // Verificar que se devolvieron los clientes correctamente
    expect(result).toEqual(mockCustomers);
    
    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should throw NotFound error when neighborhood does not exist', async () => {
    // Configurar el mock para que devuelva null (barrio no encontrado)
    mockNeighborhoodRepository.setMockNeighborhood(null);
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(/Barrio con ID 123 no encontrado/);
    
    // Verificar que el método findById fue llamado
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    
    // Verificar que el método findByNeighborhood NO fue llamado
    expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(false);
  });

  test('should throw BadRequest when pagination is invalid', async () => {
    // Configurar los mocks para devolver datos válidos
    mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
    
    // Espiar el método create de PaginationDto para que devuelva un error
    const spyCreate = jest.spyOn(PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);
    
    // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
    await expect(useCase.execute('123', undefined as unknown as PaginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', undefined as unknown as PaginationDto)).rejects.toThrow('Error de paginación');
    
    // Verificar que el método findById SÍ fue llamado
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    
    // Verificar que el método findByNeighborhood NO fue llamado
    expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(false);
    
    // Restaurar el espía
    spyCreate.mockRestore();
  });

  test('should propagate neighborhood repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio de barrios');
    mockNeighborhoodRepository.setMockError(testError);
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);
    
    // Verificar que el método findById fue llamado
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    
    // Verificar que el método findByNeighborhood NO fue llamado
    expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(false);
  });

  test('should propagate customer repository errors', async () => {
    // Configurar los mocks: barrio existe pero el repositorio de clientes da error
    mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
    mockCustomerRepository.setMockError(new Error('Error de prueba en el repositorio de clientes'));
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);
    
    // Verificar que el método findById fue llamado
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    
    // Verificar que el método findByNeighborhood también fue llamado
    expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
  });

  test('should propagate CustomError from repositories', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockNeighborhoodRepository.setMockError(customError);
    
    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow(CustomError);
    await expect(useCase.execute('123', paginationDto)).rejects.toThrow('Error personalizado de prueba');
    
    // Verificar que el método findById fue llamado
    expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
  });
});