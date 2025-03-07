// tests/domain/use-cases/customers/update-customer.use-case.test.ts
import { UpdateCustomerDto } from "../../../../src/domain/dtos/customers/update-customer.dto";
import { CustomerEntity } from "../../../../src/domain/entities/customers/customer";
import { NeighborhoodEntity } from "../../../../src/domain/entities/customers/neighborhood";
import { CustomError } from "../../../../src/domain/errors/custom.error";
import { CustomerRepository } from "../../../../src/domain/repositories/customers/customer.repository";
import { NeighborhoodRepository } from "../../../../src/domain/repositories/customers/neighborhood.repository";
import { UpdateCustomerUseCase } from "../../../../src/domain/use-cases/customers/update-customer.use-case";
import mongoose from "mongoose";

describe('UpdateCustomerUseCase', () => {
  // Mocks de los repositorios
  const mockCustomerRepository: jest.Mocked<CustomerRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByEmail: jest.fn(),
    findByNeighborhood: jest.fn()
  };
  
  const mockNeighborhoodRepository: jest.Mocked<NeighborhoodRepository> = {
    create: jest.fn(),
    getAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByName: jest.fn(),
    findByNameForCreate: jest.fn(),
    findByCity: jest.fn()
  };
  
  // Inicialización del caso de uso a probar
  let updateCustomerUseCase: UpdateCustomerUseCase;
  
  // Datos de prueba
  const customerId = new mongoose.Types.ObjectId().toString();
  const neighborhoodId = new mongoose.Types.ObjectId().toString();
  const newNeighborhoodId = new mongoose.Types.ObjectId().toString();
  
  const validUpdateData = {
    name: 'Cliente Actualizado',
    email: 'actualizado@ejemplo.com',
    phone: '+5491187654321',
    address: 'Nueva Dirección 123',
    neighborhoodId: newNeighborhoodId,
    isActive: false
  };
  
  // Crear el DTO usando el método estático update
  const [error, validUpdateCustomerDto] = UpdateCustomerDto.update(validUpdateData);
  
  // Verificar que no hay error y el DTO se creó correctamente
  if (error || !validUpdateCustomerDto) {
    throw new Error(`Failed to create test UpdateCustomerDto: ${error}`);
  }
  
  // Mocks de entidades para las pruebas
  const mockCity = {
    id: 1,
    name: 'Buenos Aires',
    description: 'Capital de Argentina',
    isActive: true
  };
  
  const mockNeighborhood: NeighborhoodEntity = {
    id: 2,
    name: 'Palermo',
    description: 'Barrio turístico',
    city: mockCity,
    isActive: true
  };
  
  const mockNewNeighborhood: NeighborhoodEntity = {
    id: 3,
    name: 'Recoleta',
    description: 'Barrio elegante',
    city: mockCity,
    isActive: true
  };
  
  const mockExistingCustomer: CustomerEntity = {
    id: 4,
    name: 'Juan Pérez',
    email: 'juan.perez@ejemplo.com',
    phone: '+5491123456789',
    address: 'Calle Antigua 456',
    neighborhood: mockNeighborhood,
    isActive: true
  };
  
  const mockUpdatedCustomer: CustomerEntity = {
    id: 4,
    name: 'Cliente Actualizado',
    email: 'actualizado@ejemplo.com',
    phone: '+5491187654321',
    address: 'Nueva Dirección 123',
    neighborhood: mockNewNeighborhood,
    isActive: false
  };
  
  // Configuración previa a cada prueba
  beforeEach(() => {
    jest.resetAllMocks();
    updateCustomerUseCase = new UpdateCustomerUseCase(
      mockCustomerRepository,
      mockNeighborhoodRepository
    );
    
    // Configurar el comportamiento por defecto de los mocks
    mockCustomerRepository.findById.mockResolvedValue(mockExistingCustomer);
    mockNeighborhoodRepository.findById.mockResolvedValue(mockNewNeighborhood);
    mockCustomerRepository.findByEmail.mockResolvedValue(null); // No hay conflicto de email
    mockCustomerRepository.update.mockResolvedValue(mockUpdatedCustomer);
  });
  
  // Prueba del flujo exitoso
  test('should update a customer successfully', async () => {
    // Ejecutar el caso de uso
    const result = await updateCustomerUseCase.execute(customerId, validUpdateCustomerDto);
    
    // Verificaciones
    expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId);
    
    // Si el DTO incluye neighborhoodId, verificamos que se consultó el barrio
    if (validUpdateCustomerDto.neighborhoodId) {
      expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(validUpdateCustomerDto.neighborhoodId);
    }
    
    // Si el DTO incluye email y es diferente al actual, verificamos que se buscó por email
    if (validUpdateCustomerDto.email && validUpdateCustomerDto.email !== mockExistingCustomer.email) {
      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(validUpdateCustomerDto.email);
    }
    
    expect(mockCustomerRepository.update).toHaveBeenCalledWith(customerId, validUpdateCustomerDto);
    expect(result).toEqual(mockUpdatedCustomer);
  });
  
  // Prueba de cliente no encontrado
  test('should throw an error if customer is not found', async () => {
    // Simular que el cliente no existe
    mockCustomerRepository.findById.mockRejectedValue(
      CustomError.notFound('update-customer-use-case, Cliente no encontrado')
    );
    
    // Verificar que se lanza el error adecuado
    await expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
      .rejects
      .toThrow(CustomError);
    
    await expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
      .rejects
      .toThrow(/Cliente no encontrado/);
      
    // Verificar que no se intentó actualizar el cliente
    expect(mockCustomerRepository.update).not.toHaveBeenCalled();
  });
  
  // Prueba de barrio no encontrado
  test('should throw an error if new neighborhood is not found', async () => {
    // Creamos un DTO que solo actualiza el barrio
    const updateNeighborhoodOnlyDto = {
      neighborhoodId: newNeighborhoodId
    };
    
    const [error, dto] = UpdateCustomerDto.update(updateNeighborhoodOnlyDto);
    expect(error).toBeUndefined();
    
    // Simular que el barrio no existe
    mockNeighborhoodRepository.findById.mockRejectedValue(
      CustomError.notFound('Barrio no encontrado')
    );
    
    // Verificar que se lanza el error adecuado
    await expect(updateCustomerUseCase.execute(customerId, dto!))
      .rejects
      .toThrow(CustomError);
    
    await expect(updateCustomerUseCase.execute(customerId, dto!))
      .rejects
      .toThrow(/Barrio no encontrado/);
      
    // Verificar que no se intentó actualizar el cliente
    expect(mockCustomerRepository.update).not.toHaveBeenCalled();
  });
  
  // Prueba de email duplicado
  test('should throw an error if new email is already in use by another customer', async () => {
    // Creamos un DTO que solo actualiza el email
    const updateEmailOnlyDto = {
      email: 'email.existente@ejemplo.com'
    };
    
    const [error, dto] = UpdateCustomerDto.update(updateEmailOnlyDto);
    expect(error).toBeUndefined();
    
    // Simular que ya existe un cliente con ese email
    const anotherCustomer = { ...mockExistingCustomer, id: 999 }; // ID diferente
    mockCustomerRepository.findByEmail.mockResolvedValue(anotherCustomer);
    
    // Verificar que se lanza el error adecuado
    await expect(updateCustomerUseCase.execute(customerId, dto!))
      .rejects
      .toThrow(CustomError);
    
    await expect(updateCustomerUseCase.execute(customerId, dto!))
      .rejects
      .toThrow(/El email ya está en uso por otro cliente/);
      
    // Verificar que no se intentó actualizar el cliente
    expect(mockCustomerRepository.update).not.toHaveBeenCalled();
  });
  
  // Prueba de que se permite usar el mismo email si es el mismo cliente
  test('should allow using the same email for the same customer', async () => {
    // Creamos un DTO que actualiza el email al mismo valor
    const updateSameEmailDto = {
      email: mockExistingCustomer.email
    };
    
    const [error, dto] = UpdateCustomerDto.update(updateSameEmailDto);
    expect(error).toBeUndefined();
    
    // Simular que existe un cliente con ese email (el mismo cliente)
    mockCustomerRepository.findByEmail.mockResolvedValue(mockExistingCustomer);
    
    // Ejecutar el caso de uso
    await updateCustomerUseCase.execute(customerId, dto!);
    
    // Verificar que se realizó la actualización
    expect(mockCustomerRepository.update).toHaveBeenCalledWith(customerId, dto);
  });
  
  // Prueba de manejo de errores del repositorio
  test('should handle repository errors', async () => {
    // Simular un error en el repositorio de clientes
    const repositoryError = new Error('Database connection error');
    mockCustomerRepository.update.mockRejectedValue(repositoryError);
    
    // Verificar que el error se transforma en un CustomError
    await expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
      .rejects
      .toBeInstanceOf(CustomError);
    
    await expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
      .rejects
      .toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('update-customer-use-case')
      });
  });
  
  // Prueba de error específico del dominio
  test('should handle custom domain errors', async () => {
    // Simular un error específico del dominio
    const domainError = CustomError.badRequest('Invalid customer data');
    mockCustomerRepository.update.mockRejectedValue(domainError);
    
    // Verificar que el error se propaga sin cambios
    await expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
      .rejects
      .toThrow(domainError);
  });
});