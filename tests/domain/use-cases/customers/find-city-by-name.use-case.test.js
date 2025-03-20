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
const find_city_by_name_use_case_1 = require("../../../../src/domain/use-cases/customers/find-city-by-name.use-case");
// Mock del CityRepository
class MockCityRepository {
    constructor() {
        this.mockCity = null;
        this.mockError = null;
        this.findByNameCalled = false;
    }
    // Mock para simular diferentes respuestas
    setMockCity(city) {
        this.mockCity = city;
    }
    setMockError(error) {
        this.mockError = error;
    }
    wasFindByNameCalled() {
        return this.findByNameCalled;
    }
    // Implementación del método findByName del repositorio
    findByName(name, paginationDto) {
        return __awaiter(this, void 0, void 0, function* () {
            this.findByNameCalled = true;
            if (this.mockError) {
                throw this.mockError;
            }
            if (!this.mockCity) {
                throw custom_error_1.CustomError.notFound(`Ciudad con nombre ${name} no encontrada`);
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
    findById() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    update() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    findByNameForCreate() {
        return __awaiter(this, void 0, void 0, function* () { return null; });
    }
}
describe('FindCityByNameUseCase', () => {
    let mockRepository;
    let useCase;
    let paginationDto;
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
        useCase = new find_city_by_name_use_case_1.FindCityByNameUseCase(mockRepository);
        // Crear un PaginationDto válido (asumiendo que el constructor es accesible)
        const [error, pagination] = pagination_dto_1.PaginationDto.create(1, 10);
        expect(error).toBeUndefined();
        paginationDto = pagination;
    });
    test('should find city by name successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver una ciudad válida
        mockRepository.setMockCity(mockCity);
        // Ejecutar el caso de uso
        const result = yield useCase.execute('Ciudad Test', paginationDto);
        // Verificar que el método findByName fue llamado
        expect(mockRepository.wasFindByNameCalled()).toBe(true);
        // Verificar que se devolvió la ciudad correctamente
        expect(result).toEqual(mockCity);
    }));
    test('should use default pagination when none is provided', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver una ciudad válida
        mockRepository.setMockCity(mockCity);
        // Espiar el método create de PaginationDto
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create');
        // Ejecutar el caso de uso sin proporcionar paginación (pasando undefined)
        const result = yield useCase.execute('Ciudad Test', undefined);
        // Verificar que se creó una paginación por defecto
        expect(spyCreate).toHaveBeenCalledWith(1, 5);
        // Verificar que el método findByName fue llamado
        expect(mockRepository.wasFindByNameCalled()).toBe(true);
        // Verificar que se devolvió la ciudad correctamente
        expect(result).toEqual(mockCity);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should throw NotFound error when city does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que devuelva null (ciudad no encontrada)
        mockRepository.setMockCity(null);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('Ciudad Inexistente', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('Ciudad Inexistente', paginationDto)).rejects.toThrow(/Ciudad.*no encontrada/);
        // Verificar que el método findByName fue llamado
        expect(mockRepository.wasFindByNameCalled()).toBe(true);
    }));
    test('should throw BadRequest when pagination is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para devolver una ciudad válida
        mockRepository.setMockCity(mockCity);
        // Espiar el método create de PaginationDto para que devuelva un error
        const spyCreate = jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue(['Error de paginación', undefined]);
        // Ejecutar el caso de uso sin proporcionar paginación (que debería intentar crear una por defecto)
        yield expect(useCase.execute('Ciudad Test', undefined)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('Ciudad Test', undefined)).rejects.toThrow('Error de paginación');
        // Verificar que el método findByName NO fue llamado (porque falló antes)
        expect(mockRepository.wasFindByNameCalled()).toBe(false);
        // Restaurar el espía
        spyCreate.mockRestore();
    }));
    test('should propagate repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un error específico
        const testError = new Error('Error de prueba en el repositorio');
        mockRepository.setMockError(testError);
        // Ejecutar el caso de uso y esperar que lance una excepción
        yield expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow(/error interno del servidor/);
        // Verificar que el método findByName fue llamado
        expect(mockRepository.wasFindByNameCalled()).toBe(true);
    }));
    test('should propagate CustomError from repository', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que lance un CustomError específico
        const customError = custom_error_1.CustomError.badRequest('Error personalizado de prueba');
        mockRepository.setMockError(customError);
        // Ejecutar el caso de uso y esperar que lance el mismo CustomError
        yield expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow(custom_error_1.CustomError);
        yield expect(useCase.execute('Ciudad Test', paginationDto)).rejects.toThrow('Error personalizado de prueba');
        // Verificar que el método findByName fue llamado
        expect(mockRepository.wasFindByNameCalled()).toBe(true);
    }));
});
