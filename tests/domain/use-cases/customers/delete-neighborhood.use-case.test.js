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
const delete_neighborhood_use_case_1 = require("../../../../src/domain/use-cases/customers/delete-neighborhood.use-case");
// Mock del NeighborhoodRepository
class MockNeighborhoodRepository {
    constructor() {
        this.mockNeighborhood = null;
        this.mockError = null;
        this.deleteCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockNeighborhood(neighborhood) {
        this.mockNeighborhood = neighborhood;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasDeleteCalled() {
        return this.deleteCalled;
    }
    // Implementación del método findById del repositorio
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mockError) {
                throw this.mockError;
            }
            if (!this.mockNeighborhood) {
                throw custom_error_1.CustomError.notFound("Barrio no encontrado");
            }
            return this.mockNeighborhood;
        });
    }
    // Implementación del método delete del repositorio
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.deleteCalled = true;
            if (this.mockError) {
                throw this.mockError;
            }
            if (!this.mockNeighborhood) {
                throw custom_error_1.CustomError.notFound("Barrio no encontrado");
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
describe('DeleteNeighborhoodUseCase', () => {
    let mockRepository;
    let useCase;
    // Barrio mock para las pruebas
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
    // Configuración antes de cada prueba
    beforeEach(() => {
        mockRepository = new MockNeighborhoodRepository();
        useCase = new delete_neighborhood_use_case_1.DeleteNeighborhoodUseCase(mockRepository);
    });
    test('should delete neighborhood successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver un barrio válido
        mockRepository.setMockNeighborhood(mockNeighborhood);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('123');
        // Verificar que el método delete fue llamado
        expect(mockRepository.wasDeleteCalled()).toBe(true);
        // Verificar que se devolvió el barrio eliminado correctamente
        expect(result).toEqual(mockNeighborhood);
    }));
    test('should throw NotFound error when neighborhood does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (barrio no encontrado)
        mockRepository.setMockNeighborhood(null);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123')).rejects.toThrow(/Barrio no encontrado/);
        // Verificar que el método delete NO fue llamado
        expect(mockRepository.wasDeleteCalled()).toBe(false);
    }));
    test('should propagate repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio');
        mockRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123')).rejects.toThrow(/error interno del servidor/);
    }));
    test('should propagate CustomError from repository', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute('123')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123')).rejects.toThrow('Error personalizado de prueba');
    }));
});
