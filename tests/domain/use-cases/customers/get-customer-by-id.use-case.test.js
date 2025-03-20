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
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
const get_customer_by_id_use_case_1 = require("../../../../src/domain/use-cases/customers/get-customer-by-id.use-case");
// Mock del CustomerRepository
class MockCustomerRepository {
    constructor() {
        this.mockCustomer = null;
        this.mockError = null;
        this.findByIdCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockCustomer(customer) {
        this.mockCustomer = customer;
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
            if (!this.mockCustomer) {
                throw custom_error_1.CustomError.notFound(`Cliente con ID ${id} no encontrado`);
            }
            return this.mockCustomer;
        });
    }
    // Métodos obligatorios del CustomerRepository que no usaremos en estas pruebas
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
    findByEmail() {
        return __awaiter(this, void 0, void 0, function* () { return null; });
    }
    findByNeighborhood() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
    }
}
describe('GetCustomerByIdUseCase', () => {
    let mockRepository;
    let useCase;
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
    const mockCustomer = {
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
        useCase = new get_customer_by_id_use_case_1.GetCustomerByIdUseCase(mockRepository);
    });
    test('should get customer by id successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver un cliente válido
        mockRepository.setMockCustomer(mockCustomer);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('789');
        // Verificar que el método findById fue llamado
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que se devolvió el cliente correctamente
        expect(result).toEqual(mockCustomer);
    }));
    test('should throw NotFound error when customer does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (cliente no encontrado)
        mockRepository.setMockCustomer(null);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('999')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('999')).rejects.toThrow(/Cliente con ID 999 no encontrado/);
        // Verificar que el método findById fue llamado
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
    }));
    test('should propagate repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio');
        mockRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('789')).rejects.toThrow(custom_error_1.CustomError);
        // Usar toMatchObject para verificar el código de estado del error
        yield expect(useCase.execute('789')).rejects.toMatchObject({
            statusCode: 500
        });
        // Verificar que el método findById fue llamado
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
    }));
    test('should propagate CustomError from repository', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute('789')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('789')).rejects.toThrow('Error personalizado de prueba');
        // Verificar que el método findById fue llamado
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
    }));
});
