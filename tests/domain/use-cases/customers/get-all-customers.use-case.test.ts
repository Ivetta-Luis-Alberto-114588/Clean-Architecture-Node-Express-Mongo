import { PaginationDto } from "../../../../src/domain/dtos/shared/pagination.dto";
import { CustomerEntity } from "../../../../src/domain/entities/customers/customer";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CustomerRepository } from "../../../../src/domain/repositories/customers/customer.repository";
import { GetAllCustomersUseCase } from "../../../../src/domain/use-cases/customers/get-all-customers.use-case";


// Mock del CustomerRepository
class MockCustomerRepository implements CustomerRepository {
  private mockCustomers: CustomerEntity[] = [];
  private mockError: Error | null = null;
  private getAllCalled = false;

  // Mock para simular diferentes respuestas
  setMockCustomers(customers: CustomerEntity[]) {
    this.mockCustomers = customers;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasGetAllCalled(): boolean {
    return this.getAllCalled;
  }

  // Implementación del método getAll del repositorio
  async getAll(paginationDto: PaginationDto): Promise<CustomerEntity[]> {
    this.getAllCalled = true;
    
    if (this.mockError) {
      throw this.mockError;
    }
    
    return this.mockCustomers;
  }

  // Métodos obligatorios del CustomerRepository que no usaremos en estas pruebas
  async create() { return {} as CustomerEntity; }
  async findById() { return {} as CustomerEntity; }
  async update() { return {} as CustomerEntity; }
  async delete() { return {} as CustomerEntity; }
  async findByEmail() { return null; }
  async findByNeighborhood() { return []; }
}

describe('GetAllCustomersUseCase', () => {
  let mockRepository: MockCustomerRepository;
  let useCase: GetAllCustomersUseCase;
  let paginationDto: PaginationDto;
  
  // Datos mock para las pruebas
  const mockNeighborhood = {
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
    },
    {
      id: 345,
      name: 'Cliente Test 3',
      email: 'cliente3@test.com',
      phone: '1122334455',
      address: 'Dirección Test 3',
      neighborhood: mockNeighborhood,
      isActive: false
    }
  ];

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockCustomerRepository();
    useCase = new GetAllCustomersUseCase(mockRepository);
    
    // Crear un PaginationDto válido
    const [error, pagination] = PaginationDto.create(1, 10);
    expect(error).toBeUndefined();
    paginationDto = pagination!;
  });

  test('should get all customers successfully', async () => {
    // Configurar el mock para devolver clientes
    mockRepository.setMockCustomers(mockCustomers);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute(paginationDto);
    
    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
    
    // Verificar que se devolvieron los clientes correctamente
    expect(result).toEqual(mockCustomers);
    expect(result.length).toBe(3);
  });

  test('should return empty array when no customers found', async () => {
    // Configurar el mock para devolver un array vacío
    mockRepository.setMockCustomers([]);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute(paginationDto);
    
    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
    
    // Verificar que se devuelve un array vacío
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  test('should use default pagination when none is provided', async () => {
    // Configurar el mock para devolver clientes
    mockRepository.setMockCustomers(mockCustomers);
    
    // Espiar el método create de PaginationDto
    const spyCreate = jest.spyOn(PaginationDto, 'create');
    
    // Ejecutar el caso de uso sin proporcionar paginación
    const result = await useCase.execute(undefined as unknown as PaginationDto);
    
    // Verificar que se creó una paginación por defecto
    expect(spyCreate).toHaveBeenCalledWith(1, 5);
    
    // Verificar que el método getAll fue llamado
    expect(mockRepository.wasGetAllCalled()).toBe(true);
    
    // Verificar que se devolvieron los clientes correctamente
    expect(result).toEqual(mockCustomers);
    
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