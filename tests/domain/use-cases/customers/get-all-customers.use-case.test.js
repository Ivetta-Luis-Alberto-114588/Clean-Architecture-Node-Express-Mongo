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
const get_all_customers_use_case_1 = require("../../../../src/domain/use-cases/customers/get-all-customers.use-case");
// Mock del CustomerRepository
class MockCustomerRepository {
    constructor() {
        this.mockCustomers = [];
        this.mockError = null;
        this.getAllCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockCustomers(customers) {
        this.mockCustomers = customers;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasGetAllCalled() {
        return this.getAllCalled;
    }
    // Implementación del método getAll del repositorio
    getAll(paginationDto) {
        return __awaiter(this, void 0, void 0, function* () {
            this.getAllCalled = true;
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
    findByNeighborhood() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
    }
}
describe('GetAllCustomersUseCase', () => {
    let mockRepository;
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
        useCase = new get_all_customers_use_case_1.GetAllCustomersUseCase(mockRepository);
        // Crear un PaginationDto válido
        const [error, pagination] = pagination_dto_1.PaginationDto.create(1, 10);
        expect(error).toBeUndefined();
        paginationDto = pagination;
    });
    test('should get all customers successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver clientes
        mockRepository.setMockCustomers(mockCustomers);
        // Ejecutar el caso de uso
        const result = yield useCase.execute(paginationDto);
        // Verificar que el método getAll fue llamado
        expect(mockRepository.wasGetAllCalled()).toBe(true);
        // Verificar que se devolvieron los clientes correctamente
        expect(result).toEqual(mockCustomers);
        expect(result.length).toBe(3);
    }));
    test('should return empty array when no customers found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver un array vacío
        mockRepository.setMockCustomers([]);
        // Ejecutar el caso de uso
        const result = yield useCase.execute(paginationDto);
        // Verificar que el método getAll fue llamado
        expect(mockRepository.wasGetAllCalled()).toBe(true);
        // Verificar que se devuelve un array vacío
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    }));
    test('should use default pagination when none is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver clientes
        mockRepository.setMockCustomers(mockCustomers);
        // Espiar el método create de PaginationDto
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create');
        // Ejecutar el caso de uso sin proporcionar paginación
        const result = yield useCase.execute(undefined);
        // Verificar que se creó una paginación por defecto
        expect(spyCreate).toHaveBeenCalledWith(1, 5);
        // Verificar que el método getAll fue llamado
        expect(mockRepository.wasGetAllCalled()).toBe(true);
        // Verificar que se devolvieron los clientes correctamente
        expect(result).toEqual(mockCustomers);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should throw BadRequest when pagination is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        // Espiar el método create de PaginationDto para que devuelva un error
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);
        // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
        yield expect(useCase.execute(undefined)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute(undefined)).rejects.toThrow('Error de paginación');
        // Verificar que el método getAll NO fue llamado
        expect(mockRepository.wasGetAllCalled()).toBe(false);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should propagate repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio');
        mockRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute(paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute(paginationDto)).rejects.toThrow(/error interno del servidor/);
        // Verificar que el método getAll fue llamado
        expect(mockRepository.wasGetAllCalled()).toBe(true);
    }));
    test('should propagate CustomError from repository', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute(paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute(paginationDto)).rejects.toThrow('Error personalizado de prueba');
        // Verificar que el método getAll fue llamado
        expect(mockRepository.wasGetAllCalled()).toBe(true);
    }));
});
