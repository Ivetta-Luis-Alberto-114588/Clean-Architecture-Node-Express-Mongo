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
const delete_city_use_case_1 = require("../../../../src/domain/use-cases/customers/delete-city.use-case");
describe('DeleteCityUseCase', () => {
    // Mock del CityRepository
    const mockCityRepository = {
        create: jest.fn(),
        getAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByName: jest.fn(),
        findByNameForCreate: jest.fn()
    };
    // Instancia del caso de uso que vamos a probar
    const deleteCity = new delete_city_use_case_1.DeleteCityUseCase(mockCityRepository);
    // Ciudad de ejemplo para pruebas
    const mockCity = {
        id: 1,
        name: 'test city',
        description: 'test description',
        isActive: true
    };
    // Antes de cada prueba, reiniciar los mocks
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('should delete a city when it exists', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el comportamiento esperado del mock
        mockCityRepository.findById.mockResolvedValue(mockCity);
        mockCityRepository.delete.mockResolvedValue(mockCity);
        // Ejecutar el caso de uso
        const result = yield deleteCity.execute('1');
        // Verificar que se llamaron los métodos correctos
        expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
        expect(mockCityRepository.delete).toHaveBeenCalledWith('1');
        // Verificar el resultado
        expect(result).toEqual(mockCity);
    }));
    test('should throw a not found error when city does not exist', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el comportamiento esperado del mock para simular una ciudad no encontrada
        mockCityRepository.findById.mockResolvedValue(null);
        // Ejecutar el caso de uso y esperar que lance un error
        yield expect(deleteCity.execute('nonexistent-id'))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        // Verificar que findById fue llamado pero delete no
        expect(mockCityRepository.findById).toHaveBeenCalledWith('nonexistent-id');
        expect(mockCityRepository.delete).not.toHaveBeenCalled();
    }));
    test('should propagate CustomErrors from repository', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para que findById lance un CustomError
        const customError = new custom_error_1.CustomError(404, 'city not found');
        mockCityRepository.findById.mockRejectedValue(customError);
        // Ejecutar y verificar que el error se propaga
        yield expect(deleteCity.execute('1'))
            .rejects
            .toBe(customError);
        expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
        expect(mockCityRepository.delete).not.toHaveBeenCalled();
    }));
    test('should convert unknown errors to internal server errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el mock para lanzar un error genérico
        mockCityRepository.findById.mockResolvedValue(mockCity);
        mockCityRepository.delete.mockRejectedValue(new Error('Database connection failed'));
        // Ejecutar el caso de uso
        const resultPromise = deleteCity.execute('1');
        // Verificar que se convierte a un CustomError con código 500
        yield expect(resultPromise)
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield resultPromise.catch(error => {
            expect(error.statusCode).toBe(500);
            expect(error.message).toContain('error interno del servidor');
        });
        // Verificar que los métodos fueron llamados
        expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
        expect(mockCityRepository.delete).toHaveBeenCalledWith('1');
    }));
    test('should handle successfully deleted city', () => __awaiter(void 0, void 0, void 0, function* () {
        // Configurar el comportamiento esperado para una eliminación exitosa
        const deletedCity = Object.assign(Object.assign({}, mockCity), { isActive: false });
        mockCityRepository.findById.mockResolvedValue(mockCity);
        mockCityRepository.delete.mockResolvedValue(deletedCity);
        // Ejecutar el caso de uso
        const result = yield deleteCity.execute('1');
        // Verificar que se llamaron los métodos correctos
        expect(mockCityRepository.findById).toHaveBeenCalledWith('1');
        expect(mockCityRepository.delete).toHaveBeenCalledWith('1');
        // Verificar el resultado (la ciudad eliminada)
        expect(result).toEqual(deletedCity);
        expect(result).not.toBe(mockCity); // Asegurarse de que es una referencia diferente
    }));
});
