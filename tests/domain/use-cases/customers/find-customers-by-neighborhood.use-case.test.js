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
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_dto_1 = require("../../../../src/domain/dtos/shared/pagination.dto");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
const find_customers_by_neighborhood_use_case_1 = require("../../../../src/domain/use-cases/customers/find-customers-by-neighborhood.use-case");
// Mock del CustomerRepository
class MockCustomerRepository {
    constructor() {
        this.mockCustomers = [];
        this.mockError = null;
        this.findByNeighborhoodCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockCustomers(customers) {
        this.mockCustomers = customers;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasFindByNeighborhoodCalled() {
        return this.findByNeighborhoodCalled;
    }
    // Implementación del método findByNeighborhood del repositorio
    findByNeighborhood(neighborhoodId, paginationDto) {
        return __awaiter(this, void 0, void 0, function* () {
            this.findByNeighborhoodCalled = true;
            if (this.mockError) {
                throw this.mockError;
            }
            return this.mockCustomers;
        });
    }
    // Métodos obligatorios del CustomerRepository que no usaremos en estas pruebas
    create() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
    }
    findById() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    findByEmail() {
        return __awaiter(this, void 0, void 0, function* () { return null; });
    }
}
// Mock del NeighborhoodRepository
class MockNeighborhoodRepository {
    constructor() {
        this.mockNeighborhood = null;
        this.mockError = null;
        this.findByIdCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockNeighborhood(neighborhood) {
        this.mockNeighborhood = neighborhood;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasFindByIdCalled() {
        return this.findByIdCalled;
    }
    // Implementación del método findById del repositorio
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.findByIdCalled = true;
            if (this.mockError) {
                throw this.mockError;
            }
            if (!this.mockNeighborhood) {
                throw custom_error_1.CustomError.notFound(`Barrio con ID ${id} no encontrado`);
            }
            return this.mockNeighborhood;
        });
    }
    // Métodos obligatorios del NeighborhoodRepository que no usaremos en estas pruebas
    create() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    findByName() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    findByNameForCreate() {
        return __awaiter(this, void 0, void 0, function* () { return null; });
    }
    findByCity() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
    }
}
describe('FindCustomersByNeighborhoodUseCase', () => {
    let mockCustomerRepository;
    let mockNeighborhoodRepository;
    let useCase;
    let paginationDto;
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
    const mockCustomers = [
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
        useCase = new find_customers_by_neighborhood_use_case_1.FindCustomersByNeighborhoodUseCase(mockCustomerRepository, mockNeighborhoodRepository);
        // Crear un PaginationDto válido
        const [error, pagination] = pagination_dto_1.PaginationDto.create(1, 10);
        expect(error).toBeUndefined();
        paginationDto = pagination;
    });
    test('should find customers by neighborhood successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks para devolver datos válidos
        mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
        mockCustomerRepository.setMockCustomers(mockCustomers);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('123', paginationDto);
        // Verificar que los métodos fueron llamados
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
        expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
        // Verificar que se devolvieron los clientes correctamente
        expect(result).toEqual(mockCustomers);
        expect(result.length).toBe(2);
    }));
    test('should return empty array when no customers found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks: barrio existe pero no hay clientes
        mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
        mockCustomerRepository.setMockCustomers([]);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('123', paginationDto);
        // Verificar que los métodos fueron llamados
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
        expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
        // Verificar que se devuelve un array vacío
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    }));
    test('should use default pagination when none is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks para devolver datos válidos
        mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
        mockCustomerRepository.setMockCustomers(mockCustomers);
        // Espiar el método create de PaginationDto
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create');
        // Ejecutar el caso de uso sin proporcionar paginación
        const result = yield useCase.execute('123', undefined);
        // Verificar que se creó una paginación por defecto
        expect(spyCreate).toHaveBeenCalledWith(1, 5);
        // Verificar que los métodos fueron llamados
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
        expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
        // Verificar que se devolvieron los clientes correctamente
        expect(result).toEqual(mockCustomers);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should throw NotFound error when neighborhood does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (barrio no encontrado)
        mockNeighborhoodRepository.setMockNeighborhood(null);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(/Barrio con ID 123 no encontrado/);
        // Verificar que el método findById fue llamado
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByNeighborhood NO fue llamado
        expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(false);
    }));
    test('should throw BadRequest when pagination is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks para devolver datos válidos
        mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
        // Espiar el método create de PaginationDto para que devuelva un error
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);
        // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
        yield expect(useCase.execute('123', undefined)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', undefined)).rejects.toThrow('Error de paginación');
        // Verificar que el método findById SÍ fue llamado
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByNeighborhood NO fue llamado
        expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(false);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should propagate neighborhood repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio de barrios');
        mockNeighborhoodRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);
        // Verificar que el método findById fue llamado
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByNeighborhood NO fue llamado
        expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(false);
    }));
    test('should propagate customer repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks: barrio existe pero el repositorio de clientes da error
        mockNeighborhoodRepository.setMockNeighborhood(mockNeighborhood);
        mockCustomerRepository.setMockError(new Error('Error de prueba en el repositorio de clientes'));
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);
        // Verificar que el método findById fue llamado
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByNeighborhood también fue llamado
        expect(mockCustomerRepository.wasFindByNeighborhoodCalled()).toBe(true);
    }));
    test('should propagate CustomError from repositories', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockNeighborhoodRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow('Error personalizado de prueba');
        // Verificar que el método findById fue llamado
        expect(mockNeighborhoodRepository.wasFindByIdCalled()).toBe(true);
    }));
});
