import { CustomerEntity } from "../../../../src/domain/entities/customers/customer";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CustomerRepository } from "../../../../src/domain/repositories/customers/customer.repository";
import { GetCustomerByEmailUseCase } from "../../../../src/domain/use-cases/customers/get-customer-by-email.use-case";


// Mock del CustomerRepository
class MockCustomerRepository implements CustomerRepository {
  private mockCustomer: CustomerEntity | null = null;
  private mockError: Error | null = null;
  private findByEmailCalled = false;

  // Mock para simular diferentes respuestas
  setMockCustomer(customer: CustomerEntity | null) {
    this.mockCustomer = customer;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasFindByEmailCalled(): boolean {
    return this.findByEmailCalled;
  }

  // Implementación del método findByEmail del repositorio
  async findByEmail(email: string): Promise<CustomerEntity | null> {
    this.findByEmailCalled = true;
    
    if (this.mockError) {
      throw this.mockError;
    }
    
    return this.mockCustomer;
  }

  // Métodos obligatorios del CustomerRepository que no usaremos en estas pruebas
  async create() { return {} as CustomerEntity; }
  async getAll() { return []; }
  async findById() { return {} as CustomerEntity; }
  async update() { return {} as CustomerEntity; }
  async delete() { return {} as CustomerEntity; }
  async findByNeighborhood() { return []; }
}

describe('GetCustomerByEmailUseCase', () => {
  let mockRepository: MockCustomerRepository;
  let useCase: GetCustomerByEmailUseCase;
  
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
    useCase = new GetCustomerByEmailUseCase(mockRepository);
  });

  test('should get customer by email successfully', async () => {
    // Configurar el mock para devolver un cliente válido
    mockRepository.setMockCustomer(mockCustomer);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute('cliente@test.com');
    
    // Verificar que el método findByEmail fue llamado
    expect(mockRepository.wasFindByEmailCalled()).toBe(true);
    
    // Verificar que se devolvió el cliente correctamente
    expect(result).toEqual(mockCustomer);
  });

  test('should return null when customer does not exist', async () => {
    // Configurar el mock para que devuelva null (cliente no encontrado)
    mockRepository.setMockCustomer(null);
    
    // Ejecutar el caso de uso
    const result = await useCase.execute('cliente@test.com');
    
    // Verificar que el método findByEmail fue llamado
    expect(mockRepository.wasFindByEmailCalled()).toBe(true);
    
    // Verificar que se devuelve null
    expect(result).toBeNull();
  });

  test('should throw BadRequest error when email format is invalid', async () => {
    // Ejecutar el caso de uso con un email inválido y esperar que lance una excepción
    await expect(useCase.execute('emailinvalido')).rejects.toThrow(CustomError);
    await expect(useCase.execute('emailinvalido')).rejects.toThrow(/Formato de email inválido/);
    
    // Verificar que el método findByEmail NO fue llamado debido al error de validación
    expect(mockRepository.wasFindByEmailCalled()).toBe(false);
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);
    
    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('cliente@test.com')).rejects.toThrow(CustomError);
    
    // Usar toMatchObject para verificar el código de estado del error
    // en lugar de depender del mensaje exacto
    await expect(useCase.execute('cliente@test.com')).rejects.toMatchObject({
      statusCode: 500
    });
    
    // Verificar que el método findByEmail fue llamado
    expect(mockRepository.wasFindByEmailCalled()).toBe(true);
  });

  test('should propagate CustomError from repository', async () => {
    // Configurar el mock para que lance un CustomError específico
    const customError = CustomError.badRequest('Error personalizado de prueba');
    mockRepository.setMockError(customError);
    
    // Ejecutar el caso de uso y esperar que lance el mismo CustomError
    await expect(useCase.execute('cliente@test.com')).rejects.toThrow(CustomError);
    await expect(useCase.execute('cliente@test.com')).rejects.toThrow('Error personalizado de prueba');
    
    // Verificar que el método findByEmail fue llamado
    expect(mockRepository.wasFindByEmailCalled()).toBe(true);
  });
});