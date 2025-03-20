"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/use-cases/customers/update-customer.use-case.test.ts
const update_customer_dto_1 = require("../../../../src/domain/dtos/customers/update-customer.dto");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
const update_customer_use_case_1 = require("../../../../src/domain/use-cases/customers/update-customer.use-case");
const mongoose_1 = __importDefault(require("mongoose"));
describe('UpdateCustomerUseCase', () => {
    // Mocks de los repositorios
    const mockCustomerRepository = {
        create: jest.fn(),
        getAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByEmail: jest.fn(),
        findByNeighborhood: jest.fn()
    };
    const mockNeighborhoodRepository = {
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
    let updateCustomerUseCase;
    // Datos de prueba
    const customerId = new mongoose_1.default.Types.ObjectId().toString();
    const neighborhoodId = new mongoose_1.default.Types.ObjectId().toString();
    const newNeighborhoodId = new mongoose_1.default.Types.ObjectId().toString();
    const validUpdateData = {
        name: 'Cliente Actualizado',
        email: 'actualizado@ejemplo.com',
        phone: '+5491187654321',
        address: 'Nueva Dirección 123',
        neighborhoodId: newNeighborhoodId,
        isActive: false
    };
    // Crear el DTO usando el método estático update
    const [error, validUpdateCustomerDto] = update_customer_dto_1.UpdateCustomerDto.update(validUpdateData);
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
    const mockNeighborhood = {
        id: 2,
        name: 'Palermo',
        description: 'Barrio turístico',
        city: mockCity,
        isActive: true
    };
    const mockNewNeighborhood = {
        id: 3,
        name: 'Recoleta',
        description: 'Barrio elegante',
        city: mockCity,
        isActive: true
    };
    const mockExistingCustomer = {
        id: 4,
        name: 'Juan Pérez',
        email: 'juan.perez@ejemplo.com',
        phone: '+5491123456789',
        address: 'Calle Antigua 456',
        neighborhood: mockNeighborhood,
        isActive: true
    };
    const mockUpdatedCustomer = {
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
        updateCustomerUseCase = new update_customer_use_case_1.UpdateCustomerUseCase(mockCustomerRepository, mockNeighborhoodRepository);
        // Configurar el comportamiento por defecto de los mocks
        mockCustomerRepository.findById.mockResolvedValue(mockExistingCustomer);
        mockNeighborhoodRepository.findById.mockResolvedValue(mockNewNeighborhood);
        mockCustomerRepository.findByEmail.mockResolvedValue(null); // No hay conflicto de email
        mockCustomerRepository.update.mockResolvedValue(mockUpdatedCustomer);
    });
    // Prueba del flujo exitoso
    test('should update a customer successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield updateCustomerUseCase.execute(customerId, validUpdateCustomerDto);
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
    }));
    // Prueba de cliente no encontrado
    test('should throw an error if customer is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que el cliente no existe
        mockCustomerRepository.findById.mockRejectedValue(custom_error_1.CustomError.notFound('update-customer-use-case, Cliente no encontrado'));
        // Verificar que se lanza el error adecuado
        yield expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
            .rejects
            .toThrow(/Cliente no encontrado/);
        // Verificar que no se intentó actualizar el cliente
        expect(mockCustomerRepository.update).not.toHaveBeenCalled();
    }));
    // Prueba de barrio no encontrado
    test('should throw an error if new neighborhood is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Creamos un DTO que solo actualiza el barrio
        const updateNeighborhoodOnlyDto = {
            neighborhoodId: newNeighborhoodId
        };
        const [error, dto] = update_customer_dto_1.UpdateCustomerDto.update(updateNeighborhoodOnlyDto);
        expect(error).toBeUndefined();
        // Simular que el barrio no existe
        mockNeighborhoodRepository.findById.mockRejectedValue(custom_error_1.CustomError.notFound('Barrio no encontrado'));
        // Verificar que se lanza el error adecuado
        yield expect(updateCustomerUseCase.execute(customerId, dto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(updateCustomerUseCase.execute(customerId, dto))
            .rejects
            .toThrow(/Barrio no encontrado/);
        // Verificar que no se intentó actualizar el cliente
        expect(mockCustomerRepository.update).not.toHaveBeenCalled();
    }));
    // Prueba de email duplicado
    test('should throw an error if new email is already in use by another customer', () => __awaiter(void 0, void 0, void 0, function* () {
        // Creamos un DTO que solo actualiza el email
        const updateEmailOnlyDto = {
            email: 'email.existente@ejemplo.com'
        };
        const [error, dto] = update_customer_dto_1.UpdateCustomerDto.update(updateEmailOnlyDto);
        expect(error).toBeUndefined();
        // Simular que ya existe un cliente con ese email
        const anotherCustomer = Object.assign(Object.assign({}, mockExistingCustomer), { id: 999 }); // ID diferente
        mockCustomerRepository.findByEmail.mockResolvedValue(anotherCustomer);
        // Verificar que se lanza el error adecuado
        yield expect(updateCustomerUseCase.execute(customerId, dto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(updateCustomerUseCase.execute(customerId, dto))
            .rejects
            .toThrow(/El email ya está en uso por otro cliente/);
        // Verificar que no se intentó actualizar el cliente
        expect(mockCustomerRepository.update).not.toHaveBeenCalled();
    }));
    // Prueba de que se permite usar el mismo email si es el mismo cliente
    test('should allow using the same email for the same customer', () => __awaiter(void 0, void 0, void 0, function* () {
        // Creamos un DTO que actualiza el email al mismo valor
        const updateSameEmailDto = {
            email: mockExistingCustomer.email
        };
        const [error, dto] = update_customer_dto_1.UpdateCustomerDto.update(updateSameEmailDto);
        expect(error).toBeUndefined();
        // Simular que existe un cliente con ese email (el mismo cliente)
        mockCustomerRepository.findByEmail.mockResolvedValue(mockExistingCustomer);
        // Ejecutar el caso de uso
        yield updateCustomerUseCase.execute(customerId, dto);
        // Verificar que se realizó la actualización
        expect(mockCustomerRepository.update).toHaveBeenCalledWith(customerId, dto);
    }));
    // Prueba de manejo de errores del repositorio
    test('should handle repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en el repositorio de clientes
        const repositoryError = new Error('Database connection error');
        mockCustomerRepository.update.mockRejectedValue(repositoryError);
        // Verificar que el error se transforma en un CustomError
        yield expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
            .rejects
            .toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('update-customer-use-case')
        });
    }));
    // Prueba de error específico del dominio
    test('should handle custom domain errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error específico del dominio
        const domainError = custom_error_1.CustomError.badRequest('Invalid customer data');
        mockCustomerRepository.update.mockRejectedValue(domainError);
        // Verificar que el error se propaga sin cambios
        yield expect(updateCustomerUseCase.execute(customerId, validUpdateCustomerDto))
            .rejects
            .toThrow(domainError);
    }));
});
