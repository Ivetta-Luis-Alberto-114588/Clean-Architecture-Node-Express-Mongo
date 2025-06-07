import { CreateAddressDto } from "../../../../src/domain/dtos/customers/create-address.dto";
import { UpdateAddressDto } from "../../../../src/domain/dtos/customers/update-address.dto";
import { PaginationDto } from "../../../../src/domain/dtos/shared/pagination.dto";
import { AddressEntity } from "../../../../src/domain/entities/customers/address.entity";
import { CustomerEntity } from "../../../../src/domain/entities/customers/customer";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CustomerRepository } from "../../../../src/domain/repositories/customers/customer.repository";
import { DeleteCustomerUseCase } from "../../../../src/domain/use-cases/customers/delete-customer.use-case";

// Mock del CustomerRepository
class MockCustomerRepository implements CustomerRepository {

  private mockCustomer: CustomerEntity | null = null;
  private mockError: Error | null = null;
  private deleteCalled = false;

  // Mock para simular diferentes respuestas
  setMockCustomer(customer: CustomerEntity | null) {
    this.mockCustomer = customer;
  }

  setMockError(error: Error) {
    this.mockError = error;
  }

  wasDeleteCalled(): boolean {
    return this.deleteCalled;
  }

  // Implementación del método findById del repositorio
  async findById(id: string): Promise<CustomerEntity> {
    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockCustomer) {
      throw CustomError.notFound(`Cliente no encontrado`);
    }

    return this.mockCustomer;
  }

  // Implementación del método delete del repositorio
  async delete(id: string): Promise<CustomerEntity> {
    this.deleteCalled = true;

    if (this.mockError) {
      throw this.mockError;
    }

    if (!this.mockCustomer) {
      throw CustomError.notFound(`Cliente no encontrado`);
    }

    return this.mockCustomer;
  }

  // Métodos obligatorios del CustomerRepository que no usaremos en estas pruebas
  async create() { return {} as CustomerEntity; }
  async getAll() { return []; }
  async update() { return {} as CustomerEntity; }
  async findByEmail() { return null; }
  async findByNeighborhood() { return []; }
  findByUserId(userId: string): Promise<CustomerEntity | null> {
    throw new Error("Method not implemented.");
  }
  async createAddress(createAddressDto: CreateAddressDto): Promise<AddressEntity> {
    throw new Error("Method not implemented.");
  }
  async getAddressesByCustomerId(customerId: string, paginationDto: PaginationDto): Promise<AddressEntity[]> {
    throw new Error("Method not implemented.");
  }
  async findAddressById(addressId: string): Promise<AddressEntity | null> {
    throw new Error("Method not implemented.");
  }
  async updateAddress(addressId: string, updateAddressDto: UpdateAddressDto): Promise<AddressEntity | null> {
    throw new Error("Method not implemented.");
  }
  async deleteAddress(addressId: string, customerId: string): Promise<AddressEntity | null> {
    throw new Error("Method not implemented.");
  }
  async setDefaultAddress(addressId: string, customerId: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }


}

describe('DeleteCustomerUseCase', () => {
  let mockRepository: MockCustomerRepository;
  let useCase: DeleteCustomerUseCase;

  // Cliente mock para las pruebas
  const mockCustomer: CustomerEntity = {
    id: "123",
    name: 'Cliente Test',
    email: 'test@example.com',
    phone: '1234567890',
    address: 'Dirección Test',
    neighborhood: {
      id: "456",
      name: 'Barrio Test',
      description: 'Descripción Test',
      city: {
        id: "789",
        name: 'Ciudad Test',
        description: 'Descripción Test',
        isActive: true
      },
      isActive: true
    },
    isActive: true
  };

  // Configuración antes de cada prueba
  beforeEach(() => {
    mockRepository = new MockCustomerRepository();
    useCase = new DeleteCustomerUseCase(mockRepository);
  });

  test('should delete customer successfully', async () => {
    // Configurar el mock para devolver un cliente válido
    mockRepository.setMockCustomer(mockCustomer);

    // Ejecutar el caso de uso
    const result = await useCase.execute('123');

    // Verificar que el método delete fue llamado
    expect(mockRepository.wasDeleteCalled()).toBe(true);

    // Verificar que se devolvió el cliente eliminado correctamente
    expect(result).toEqual(mockCustomer);
  });

  test('should throw NotFound error when customer does not exist', async () => {
    // Configurar el mock para que devuelva null (cliente no encontrado)
    mockRepository.setMockCustomer(null);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    await expect(useCase.execute('123')).rejects.toThrow('Cliente no encontrado');

    // Verificar que el método delete NO fue llamado
    expect(mockRepository.wasDeleteCalled()).toBe(false);
  });

  test('should propagate repository errors', async () => {
    // Configurar el mock para que lance un error específico
    const testError = new Error('Error de prueba en el repositorio');
    mockRepository.setMockError(testError);

    // Ejecutar el caso de uso y esperar que lance una excepción
    await expect(useCase.execute('123')).rejects.toThrow(CustomError);
    await expect(useCase.execute('123')).rejects.toThrow('delete-customer-use-case, error interno del servidor');
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