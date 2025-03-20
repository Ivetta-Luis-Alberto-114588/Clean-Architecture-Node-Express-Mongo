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
const find_neighborhoods_by_city_use_case_1 = require("../../../../src/domain/use-cases/customers/find-neighborhoods-by-city.use-case");
// Mock del NeighborhoodRepository
class MockNeighborhoodRepository {
    constructor() {
        this.mockNeighborhoods = [];
        this.mockError = null;
        this.findByCityCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockNeighborhoods(neighborhoods) {
        this.mockNeighborhoods = neighborhoods;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasFindByCityCalled() {
        return this.findByCityCalled;
    }
    // Implementación del método findByCity del repositorio
    findByCity(cityId, paginationDto) {
        return __awaiter(this, void 0, void 0, function* () {
            this.findByCityCalled = true;
            if (this.mockError) {
                throw this.mockError;
            }
            return this.mockNeighborhoods;
        });
    }
    // Métodos obligatorios del NeighborhoodRepository que no usaremos en estas pruebas
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
    findByName() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    findByNameForCreate() {
        return __awaiter(this, void 0, void 0, function* () { return null; });
    }
}
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
describe('FindNeighborhoodsByCityUseCase', () => {
    let mockNeighborhoodRepository;
    let mockCityRepository;
    let useCase;
    let paginationDto;
    // Datos mock para las pruebas
    const mockCity = {
        id: 123,
        name: 'Ciudad Test',
        description: 'Descripción Test',
        isActive: true
    };
    const mockNeighborhoods = [
        {
            id: 456,
            name: 'Barrio Test 1',
            description: 'Descripción Test 1',
            city: mockCity,
            isActive: true
        },
        {
            id: 789,
            name: 'Barrio Test 2',
            description: 'Descripción Test 2',
            city: mockCity,
            isActive: true
        }
    ];
    // Configuración antes de cada prueba
    beforeEach(() => {
        mockNeighborhoodRepository = new MockNeighborhoodRepository();
        mockCityRepository = new MockCityRepository();
        useCase = new find_neighborhoods_by_city_use_case_1.FindNeighborhoodsByCityUseCase(mockNeighborhoodRepository, mockCityRepository);
        // Crear un PaginationDto válido
        const [error, pagination] = pagination_dto_1.PaginationDto.create(1, 10);
        expect(error).toBeUndefined();
        paginationDto = pagination;
    });
    test('should find neighborhoods by city successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks para devolver datos válidos
        mockCityRepository.setMockCity(mockCity);
        mockNeighborhoodRepository.setMockNeighborhoods(mockNeighborhoods);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('123', paginationDto);
        // Verificar que los métodos fueron llamados
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
        expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);
        // Verificar que se devolvieron los barrios correctamente
        expect(result).toEqual(mockNeighborhoods);
        expect(result.length).toBe(2);
    }));
    test('should return empty array when no neighborhoods found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks: ciudad existe pero no hay barrios
        mockCityRepository.setMockCity(mockCity);
        mockNeighborhoodRepository.setMockNeighborhoods([]);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('123', paginationDto);
        // Verificar que los métodos fueron llamados
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
        expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);
        // Verificar que se devuelve un array vacío
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    }));
    test('should use default pagination when none is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks para devolver datos válidos
        mockCityRepository.setMockCity(mockCity);
        mockNeighborhoodRepository.setMockNeighborhoods(mockNeighborhoods);
        // Espiar el método create de PaginationDto
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create');
        // Ejecutar el caso de uso sin proporcionar paginación
        const result = yield useCase.execute('123', undefined);
        // Verificar que se creó una paginación por defecto
        expect(spyCreate).toHaveBeenCalledWith(1, 5);
        // Verificar que los métodos fueron llamados
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
        expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);
        // Verificar que se devolvieron los barrios correctamente
        expect(result).toEqual(mockNeighborhoods);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should throw NotFound error when city does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (ciudad no encontrada)
        mockCityRepository.setMockCity(null);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(/Ciudad con ID 123 no encontrada/);
        // Verificar que el método findById fue llamado
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByCity NO fue llamado
        expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(false);
    }));
    test('should throw BadRequest when pagination is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks para devolver datos válidos
        mockCityRepository.setMockCity(mockCity);
        // Espiar el método create de PaginationDto para que devuelva un error
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);
        // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
        yield expect(useCase.execute('123', undefined)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', undefined)).rejects.toThrow('Error de paginación');
        // Verificar que el método findById SÍ fue llamado
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByCity NO fue llamado
        expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(false);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should propagate city repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio de ciudades');
        mockCityRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);
        // Verificar que el método findById fue llamado
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByCity NO fue llamado
        expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(false);
    }));
    test('should propagate neighborhood repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar los mocks: ciudad existe pero el repositorio de barrios da error
        mockCityRepository.setMockCity(mockCity);
        mockNeighborhoodRepository.setMockError(new Error('Error de prueba en el repositorio de barrios'));
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(/error interno del servidor/);
        // Verificar que el método findById fue llamado
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
        // Verificar que el método findByCity también fue llamado
        expect(mockNeighborhoodRepository.wasFindByCityCalled()).toBe(true);
    }));
    test('should propagate CustomError from repositories', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockCityRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('123', paginationDto)).rejects.toThrow('Error personalizado de prueba');
        // Verificar que el método findById fue llamado
        expect(mockCityRepository.wasFindByIdCalled()).toBe(true);
    }));
});
