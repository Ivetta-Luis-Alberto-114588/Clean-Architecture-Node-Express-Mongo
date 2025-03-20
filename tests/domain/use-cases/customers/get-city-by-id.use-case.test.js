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
const get_city_by_id__use_case_1 = require("../../../../src/domain/use-cases/customers/get-city-by-id..use-case");
// Mock del CityRepository
class MockCityRepository {
    constructor() {
        this.mockCity = null;
        this.mockError = null;
        this.findByIdCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockCity(city) {
        this.mockCity = city;
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
            if (!this.mockCity) {
                throw custom_error_1.CustomError.notFound(`Ciudad con ID ${id} no encontrada`);
            }
            return this.mockCity;
        });
    }
    // Métodos obligatorios del CityRepository que no usaremos en estas pruebas
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
}
describe('GetCityByIdUseCase', () => {
    let mockRepository;
    let useCase;
    // Ciudad mock para las pruebas
    const mockCity = {
        id: 123,
        name: 'Ciudad Test',
        description: 'Descripción Test',
        isActive: true
    };
    // Configuración antes de cada prueba
    beforeEach(() => {
        mockRepository = new MockCityRepository();
        useCase = new get_city_by_id__use_case_1.GetCityByIdUseCase(mockRepository);
    });
    test('should get city by id successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver una ciudad válida
        mockRepository.setMockCity(mockCity);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('123');
        // Verificar que el método findById fue llamado
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que se devolvió la ciudad correctamente
        expect(result).toEqual(mockCity);
    }));
    test('should throw NotFound error when city does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (ciudad no encontrada)
        mockRepository.setMockCity(null);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123')).rejects.toThrow(/Ciudad con ID 123 no encontrada/);
        // Verificar que el método findById fue llamado
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
    }));
    test('should propagate repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio');
        mockRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123')).rejects.toThrow(custom_error_1.CustomError);
        // Usar toMatchObject para verificar el código de estado del error
        // en lugar de depender del mensaje exacto
        yield expect(useCase.execute('123')).rejects.toMatchObject({
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
        yield expect(useCase.execute('123')).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123')).rejects.toThrow('Error personalizado de prueba');
        // Verificar que el método findById fue llamado
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
    }));
});
