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
const update_city_dto_1 = require("../../../../src/domain/dtos/customers/update-city.dto");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
const update_city_use_case_1 = require("../../../../src/domain/use-cases/customers/update-city.use-case");
// Mock del CityRepository
class MockCityRepository {
    constructor() {
        this.mockCity = null;
        this.mockUpdatedCity = null;
        this.mockError = null;
        this.findByIdCalled = false;
        this.updateCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockCity(city) {
        this.mockCity = city;
    }
    setMockUpdatedCity(city) {
        this.mockUpdatedCity = city;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasFindByIdCalled() {
        return this.findByIdCalled;
    }
    wasUpdateCalled() {
        return this.updateCalled;
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
    // Implementación del método update del repositorio
    update(id, updateCityDto) {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateCalled = true;
            if (this.mockError) {
                throw this.mockError;
            }
            if (!this.mockUpdatedCity) {
                throw custom_error_1.CustomError.notFound(`Ciudad con ID ${id} no encontrada`);
            }
            return this.mockUpdatedCity;
        });
    }
    // Métodos obligatorios del CityRepository que no usaremos en estas pruebas
    create() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
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
describe('UpdateCityUseCase', () => {
    let mockRepository;
    let useCase;
    // Ciudad mock para las pruebas
    const mockCity = {
        id: 123,
        name: 'Ciudad Original',
        description: 'Descripción Original',
        isActive: true
    };
    const mockUpdatedCity = {
        id: 123,
        name: 'Ciudad Actualizada',
        description: 'Descripción Actualizada',
        isActive: false
    };
    // DTO para actualizar la ciudad
    const updateCityData = {
        name: 'Ciudad Actualizada',
        description: 'Descripción Actualizada',
        isActive: false
    };
    const [error, updateCityDto] = update_city_dto_1.UpdateCityDto.update(updateCityData);
    // Verificar que no hay error y el DTO se creó correctamente
    if (error || !updateCityDto) {
        throw new Error(`Failed to create test UpdateCityDto: ${error}`);
    }
    // Configuración antes de cada prueba
    beforeEach(() => {
        mockRepository = new MockCityRepository();
        useCase = new update_city_use_case_1.UpdateCityUseCase(mockRepository);
        // Configurar mocks por defecto
        mockRepository.setMockCity(mockCity);
        mockRepository.setMockUpdatedCity(mockUpdatedCity);
    });
    test('should update city successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield useCase.execute('123', updateCityDto);
        // Verificar que los métodos fueron llamados
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
        expect(mockRepository.wasUpdateCalled()).toBe(true);
        // Verificar que se devolvió la ciudad actualizada
        expect(result).toEqual(mockUpdatedCity);
    }));
    test('should throw NotFound error when city does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (ciudad no encontrada)
        mockRepository.setMockCity(null);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('999', updateCityDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('999', updateCityDto)).rejects.toThrow(/Ciudad con ID 999 no encontrada/);
        // Verificar que findById fue llamado pero update no
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
        expect(mockRepository.wasUpdateCalled()).toBe(false);
    }));
    test('should propagate repository errors from findById', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en findById');
        mockRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', updateCityDto)).rejects.toThrow(custom_error_1.CustomError);
        // Usar toMatchObject para verificar el código de estado del error
        yield expect(useCase.execute('123', updateCityDto)).rejects.toMatchObject({
            statusCode: 500
        });
        // Verificar que findById fue llamado pero update no
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
        expect(mockRepository.wasUpdateCalled()).toBe(false);
    }));
    test('should propagate repository errors from update', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configuramos un comportamiento especial para esta prueba
        const originalFindById = mockRepository.findById.bind(mockRepository);
        const originalUpdate = mockRepository.update.bind(mockRepository);
        let findByIdCalled = false;
        // Override del método findById para que funcione normalmente
        mockRepository.findById = (id) => __awaiter(void 0, void 0, void 0, function* () {
            findByIdCalled = true;
            return mockCity;
        });
        // Override del método update para que lance un error
        mockRepository.update = (id, dto) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error('Error de prueba en update');
        });
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', updateCityDto)).rejects.toThrow(custom_error_1.CustomError);
        // Usar toMatchObject para verificar el código de estado del error
        yield expect(useCase.execute('123', updateCityDto)).rejects.toMatchObject({
            statusCode: 500
        });
        // Verificamos que se llamaron ambos métodos
        expect(findByIdCalled).toBe(true);
        // Restauramos los métodos originales
        mockRepository.findById = originalFindById;
        mockRepository.update = originalUpdate;
    }));
    test('should propagate CustomError from repository', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute('123', updateCityDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', updateCityDto)).rejects.toThrow('Error personalizado de prueba');
        // Verificar que findById fue llamado pero update no
        expect(mockRepository.wasFindByIdCalled()).toBe(true);
        expect(mockRepository.wasUpdateCalled()).toBe(false);
    }));
});
