import { CustomerEntity } from "../../../../src/domain/entities/customers/customer";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CustomerRepository } from "../../../../src/domain/repositories/customers/customer.repository";
import { GetCustomerByIdUseCase } from "../../../../src/domain/use-cases/customers/get-customer-by-id.use-case";

// Mock del CustomerRepository
class MockCustomerRepository implements CustomerRepository {
  private mockCustomer: CustomerEntity | null = null;
  private mockError: Error | null = null;
  private findByIdCalled = false;

  // Mock para simular diferentes respuestas
  setMockCustomer(customer: CustomerEntity | null) {
    this.mockCustomer = customer;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByIdCalled(): boolean {
    return this.findByIdCalled;
  }

  // Implementación del método findById del repositorio
  async findById(id: string): Promise<CustomerEntity> {
    this.findByIdCalled = true;
    
    if (this.mockError) {
      throw this.mockError;
    }
    
    if (!this.mockCustomer) {
      throw CustomError.notFound(`Cliente con ID ${id} no encontrado`);
    }
    
    return this.mockCustomer;
  }

  // Métodos obligatorios del CustomerRepository que no usaremos en estas pruebas
  async create() { return {} as CustomerEntity; }
  async getAll() { return []; }
  async update() { return {} as CustomerEntity; }
  async delete() { return {} as CustomerEntity; }
  async findByEmail() { return null; }
  async findByNeighborhood() { return []; }
}

describe('GetCustomerByIdUseCase', () => {
  let mockRepository: MockCustomerRepository;
  let useCase: GetCustomerByIdUseCase;
  
  // Cliente mock para las pruebas
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
  
  const mockCustomer: CustomerEntity = {
    id: 789,
    name: 'Cliente Test',
    email: 'cliente@test.com',
    phone: '1234567890',
    address: 'Dirección Test',
    neighborhood: mockNeighborhood,
    isActive: true
  };

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockCustomerRepository();
    useCase = new GetCustomerByIdUseCase(mockRepository);
  });

  test('should get customer by id successfully', async () => {
    // Configurar el mock para devolver un cliente válido
    mockRepository.setMockCustomer(mockCustomer);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute('789');
    
    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
    
    // Verificar que se devolvió el cliente correctamente
    expect(result).toEqual(mockCustomer);
  });

  test('should throw NotFound error when customer does not exist', async () => {
    // Configurar el mock para que devuelva null (cliente no encontrado)
    mockRepository.setMockCustomer(null);
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('999')).rejects.toThrow(CustomError);
    await expect(useCase.execute('999')).rejects.toThrow(/Cliente con ID 999 no encontrado/);
    
    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('789')).rejects.toThrow(CustomError);
    
    // Usar toMatchObject para verificar el código de estado del error
    await expect(useCase.execute('789')).rejects.toMatchObject({
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
    await expect(useCase.execute('789')).rejects.toThrow(CustomError);
    await expect(useCase.execute('789')).rejects.toThrow('Error personalizado de prueba');
    
    // Verificar que el método findById fue llamado
    expect(mockRepository.wasFindByIdCalled()).toBe(true);
  });
});