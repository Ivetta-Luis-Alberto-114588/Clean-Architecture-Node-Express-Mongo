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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/use-cases/customers/update-neighborhood.use-case.test.ts
const update_neighborhood_dto_1 = require("../../../../src/domain/dtos/customers/update-neighborhood.dto");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
const update_neighborhood_use_case_1 = require("../../../../src/domain/use-cases/customers/update-neighborhood.use-case");
const mongoose_1 = __importDefault(require("mongoose"));
describe('UpdateNeighborhoodUseCase', () => {
    // Mocks de los repositorios
    const mockNeighborhoodRepository = {
        create: jest.fn(),
        getAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByName: jest.fn(),
        findByNameForCreate: jest.fn(),
        findByCity: jest.fn()
    };
    const mockCityRepository = {
        create: jest.fn(),
        getAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByName: jest.fn(),
        findByNameForCreate: jest.fn()
    };
    // Inicialización del caso de uso a probar
    let updateNeighborhoodUseCase;
    // Datos de prueba
    const neighborhoodId = new mongoose_1.default.Types.ObjectId().toString();
    const cityId = new mongoose_1.default.Types.ObjectId().toString();
    const newCityId = new mongoose_1.default.Types.ObjectId().toString();
    const validUpdateData = {
        name: 'Barrio Actualizado',
        description: 'Descripción actualizada',
        cityId: newCityId,
        isActive: false
    };
    // Crear el DTO usando el método estático update
    const [error, validUpdateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(validUpdateData);
    // Verificar que no hay error y el DTO se creó correctamente
    if (error || !validUpdateNeighborhoodDto) {
        throw new Error(`Failed to create test UpdateNeighborhoodDto: ${error}`);
    }
    // Mocks de entidades para las pruebas
    const mockCity = {
        id: 1,
        name: 'Ciudad Original',
        description: 'Descripción Original',
        isActive: true
    };
    const mockNewCity = {
        id: 2,
        name: 'Ciudad Nueva',
        description: 'Descripción Nueva',
        isActive: true
    };
    const mockExistingNeighborhood = {
        id: 3,
        name: 'Barrio Original',
        description: 'Descripción Original',
        city: mockCity,
        isActive: true
    };
    const mockUpdatedNeighborhood = {
        id: 3,
        name: 'Barrio Actualizado',
        description: 'Descripción actualizada',
        city: mockNewCity,
        isActive: false
    };
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.resetAllMocks();
        updateNeighborhoodUseCase = new update_neighborhood_use_case_1.UpdateNeighborhoodUseCase(mockNeighborhoodRepository, mockCityRepository);
        // Configurar el comportamiento por defecto de los mocks
        mockNeighborhoodRepository.findById.mockResolvedValue(mockExistingNeighborhood);
        mockCityRepository.findById.mockResolvedValue(mockNewCity);
        mockNeighborhoodRepository.update.mockResolvedValue(mockUpdatedNeighborhood);
    });
    // Prueba del flujo exitoso
    test('should update a neighborhood successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto);
        // Verificaciones
        expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);
        // Si el DTO incluye cityId, verificamos que se consultó la ciudad
        if (validUpdateNeighborhoodDto.cityId) {
            expect(mockCityRepository.findById).toHaveBeenCalledWith(validUpdateNeighborhoodDto.cityId);
        }
        expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, validUpdateNeighborhoodDto);
        expect(result).toEqual(mockUpdatedNeighborhood);
    }));
    // Prueba de barrio no encontrado
    test('should throw an error if neighborhood is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que el barrio no existe
        mockNeighborhoodRepository.findById.mockRejectedValue(custom_error_1.CustomError.notFound('update-neighborhood-use-case, Barrio no encontrado'));
        // Verificar que se lanza el error adecuado
        yield expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
            .rejects
            .toThrow(/Barrio no encontrado/);
        // Verificar que no se intentó actualizar el barrio
        expect(mockNeighborhoodRepository.update).not.toHaveBeenCalled();
    }));
    // Prueba de ciudad no encontrada
    test('should throw an error if new city is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Creamos un DTO que solo actualiza la ciudad
        const updateCityOnlyDto = {
            cityId: newCityId
        };
        const [error, dto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateCityOnlyDto);
        expect(error).toBeUndefined();
        // Simular que la ciudad no existe
        mockCityRepository.findById.mockRejectedValue(custom_error_1.CustomError.notFound('Ciudad no encontrada'));
        // Verificar que se lanza el error adecuado
        yield expect(updateNeighborhoodUseCase.execute(neighborhoodId, dto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(updateNeighborhoodUseCase.execute(neighborhoodId, dto))
            .rejects
            .toThrow(/Ciudad no encontrada/);
        // Verificar que no se intentó actualizar el barrio
        expect(mockNeighborhoodRepository.update).not.toHaveBeenCalled();
    }));
    // Prueba para actualizar solo el nombre
    test('should update only the name successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Creamos un DTO que solo actualiza el nombre
        const updateNameOnlyDto = {
            name: 'Nuevo Nombre de Barrio'
        };
        const [error, dto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateNameOnlyDto);
        expect(error).toBeUndefined();
        // Actualizamos el resultado esperado para reflejar solo el cambio de nombre
        const expectedResult = Object.assign(Object.assign({}, mockExistingNeighborhood), { name: 'Nuevo Nombre de Barrio' });
        mockNeighborhoodRepository.update.mockResolvedValue(expectedResult);
        // Ejecutar el caso de uso
        const result = yield updateNeighborhoodUseCase.execute(neighborhoodId, dto);
        // Verificaciones
        expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);
        expect(mockCityRepository.findById).not.toHaveBeenCalled(); // No debería verificar la ciudad
        expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, dto);
        expect(result).toEqual(expectedResult);
    }));
    // Prueba para actualizar solo la descripción
    test('should update only the description successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Creamos un DTO que solo actualiza la descripción
        const updateDescriptionOnlyDto = {
            description: 'Nueva descripción detallada'
        };
        const [error, dto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateDescriptionOnlyDto);
        expect(error).toBeUndefined();
        // Actualizamos el resultado esperado para reflejar solo el cambio de descripción
        const expectedResult = Object.assign(Object.assign({}, mockExistingNeighborhood), { description: 'Nueva descripción detallada' });
        mockNeighborhoodRepository.update.mockResolvedValue(expectedResult);
        // Ejecutar el caso de uso
        const result = yield updateNeighborhoodUseCase.execute(neighborhoodId, dto);
        // Verificaciones
        expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);
        expect(mockCityRepository.findById).not.toHaveBeenCalled(); // No debería verificar la ciudad
        expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, dto);
        expect(result).toEqual(expectedResult);
    }));
    // Prueba para actualizar solo el estado activo
    test('should update only the active status successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Creamos un DTO que solo actualiza el estado activo
        const updateActiveStatusOnlyDto = {
            isActive: false
        };
        const [error, dto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateActiveStatusOnlyDto);
        expect(error).toBeUndefined();
        // Actualizamos el resultado esperado para reflejar solo el cambio de estado
        const expectedResult = Object.assign(Object.assign({}, mockExistingNeighborhood), { isActive: false });
        mockNeighborhoodRepository.update.mockResolvedValue(expectedResult);
        // Ejecutar el caso de uso
        const result = yield updateNeighborhoodUseCase.execute(neighborhoodId, dto);
        // Verificaciones
        expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(neighborhoodId);
        expect(mockCityRepository.findById).not.toHaveBeenCalled(); // No debería verificar la ciudad
        expect(mockNeighborhoodRepository.update).toHaveBeenCalledWith(neighborhoodId, dto);
        expect(result).toEqual(expectedResult);
    }));
    // Prueba de manejo de errores del repositorio
    test('should handle repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en el repositorio de barrios
        const repositoryError = new Error('Database connection error');
        mockNeighborhoodRepository.update.mockRejectedValue(repositoryError);
        // Verificar que el error se transforma en un CustomError
        yield expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
            .rejects
            .toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('update-neighborhood-use-case')
        });
    }));
    // Prueba de error específico del dominio
    test('should handle custom domain errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error específico del dominio
        const domainError = custom_error_1.CustomError.badRequest('Invalid neighborhood data');
        mockNeighborhoodRepository.update.mockRejectedValue(domainError);
        // Verificar que el error se propaga sin cambios
        yield expect(updateNeighborhoodUseCase.execute(neighborhoodId, validUpdateNeighborhoodDto))
            .rejects
            .toThrow(domainError);
    }));
});
