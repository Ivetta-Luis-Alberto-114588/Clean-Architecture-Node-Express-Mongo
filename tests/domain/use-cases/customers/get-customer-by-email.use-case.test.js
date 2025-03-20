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
const get_customer_by_email_use_case_1 = require("../../../../src/domain/use-cases/customers/get-customer-by-email.use-case");
// Mock del CustomerRepository
class MockCustomerRepository {
    constructor() {
        this.mockCustomer = null;
        this.mockError = null;
        this.findByEmailCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockCustomer(customer) {
        this.mockCustomer = customer;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasFindByEmailCalled() {
        return this.findByEmailCalled;
    }
    // Implementación del método findByEmail del repositorio
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            this.findByEmailCalled = true;
            if (this.mockError) {
                throw this.mockError;
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
    findById() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    findByNeighborhood() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
    }
}
describe('GetCustomerByEmailUseCase', () => {
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
        useCase = new get_customer_by_email_use_case_1.GetCustomerByEmailUseCase(mockRepository);
    });
    test('should get customer by email successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver un cliente válido
        mockRepository.setMockCustomer(mockCustomer);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('cliente@test.com');
        // Verificar que el método findByEmail fue llamado
        expect(mockRepository.wasFindByEmailCalled()).toBe(true);
        // Verificar que se devolvió el cliente correctamente
        expect(result).toEqual(mockCustomer);
    }));
    test('should return null when customer does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (cliente no encontrado)
        mockRepository.setMockCustomer(null);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('cliente@test.com');
        // Verificar que el método findByEmail fue llamado
        expect(mockRepository.wasFindByEmailCalled()).toBe(true);
        // Verificar que se devuelve null
        expect(result).toBeNull();
    }));
    test('should throw BadRequest error when email format is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso con un email inválido y esperar que lance una excepción
        yield expect(useCase.execute('emailinvalido')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('emailinvalido')).rejects.toThrow(/Formato de email inválido/);
        // Verificar que el método findByEmail NO fue llamado debido al error de validación
        expect(mockRepository.wasFindByEmailCalled()).toBe(false);
    }));
    test('should propagate repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio');
        mockRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('cliente@test.com')).rejects.toThrow(custom_error_1.CustomError);
        // Usar toMatchObject para verificar el código de estado del error
        // en lugar de depender del mensaje exacto
        yield expect(useCase.execute('cliente@test.com')).rejects.toMatchObject({
            statusCode: 500
        });
        // Verificar que el método findByEmail fue llamado
        expect(mockRepository.wasFindByEmailCalled()).toBe(true);
    }));
    test('should propagate CustomError from repository', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute('cliente@test.com')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('cliente@test.com')).rejects.toThrow('Error personalizado de prueba');
        // Verificar que el método findByEmail fue llamado
        expect(mockRepository.wasFindByEmailCalled()).toBe(true);
    }));
});
