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
// tests/domain/use-cases/customers/create-neighborhood.use-case.test.ts
const create_neighborhood_use_case_1 = require("../../../../src/domain/use-cases/customers/create-neighborhood.use-case");
const create_neighborhood_dto_1 = require("../../../../src/domain/dtos/customers/create-neighborhood.dto");
const neighborhood_1 = require("../../../../src/domain/entities/customers/neighborhood");
const citiy_1 = require("../../../../src/domain/entities/customers/citiy");
const pagination_dto_1 = require("../../../../src/domain/dtos/shared/pagination.dto");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
const mongoose_1 = __importDefault(require("mongoose"));
describe('CreateNeighborhoodUseCase', () => {
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
    let createNeighborhoodUseCase;
    // Datos de prueba
    const validCityId = new mongoose_1.default.Types.ObjectId().toString();
    const validNeighborhoodData = {
        name: 'Palermo',
        description: 'Barrio turístico',
        cityId: validCityId,
        isActive: true
    };
    // Crear el DTO usando el método estático create
    const [error, validCreateNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(validNeighborhoodData);
    // Verificar que no hay error y el DTO se creó correctamente
    if (error || !validCreateNeighborhoodDto) {
        throw new Error(`Failed to create test CreateNeighborhoodDto: ${error}`);
    }
    // Mocks de entidades para las pruebas
    const mockCity = new citiy_1.CityEntity(1, 'Buenos Aires', 'Capital de Argentina', true);
    const mockNeighborhood = new neighborhood_1.NeighborhoodEntity(2, 'palermo', 'barrio turístico', mockCity, true);
    // PaginationDto mock para las pruebas
    const mockPaginationDto = { page: 1, limit: 1 };
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.resetAllMocks();
        createNeighborhoodUseCase = new create_neighborhood_use_case_1.CreateNeighborhoodUseCase(mockNeighborhoodRepository, mockCityRepository);
        // Configurar el comportamiento por defecto de los mocks
        mockCityRepository.findById.mockResolvedValue(mockCity);
        mockNeighborhoodRepository.findByNameForCreate.mockResolvedValue(null); // El barrio no existe
        mockNeighborhoodRepository.create.mockResolvedValue(mockNeighborhood);
        // Mock para PaginationDto.create
        jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue([undefined, mockPaginationDto]);
    });
    // Prueba del flujo exitoso
    test('should create a neighborhood successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield createNeighborhoodUseCase.execute(validCreateNeighborhoodDto);
        // Verificaciones
        expect(mockCityRepository.findById).toHaveBeenCalledWith(validCityId);
        expect(mockNeighborhoodRepository.findByNameForCreate).toHaveBeenCalledWith(validCreateNeighborhoodDto.name, validCityId, mockPaginationDto);
        expect(mockNeighborhoodRepository.create).toHaveBeenCalledWith(validCreateNeighborhoodDto);
        expect(result).toEqual(mockNeighborhood);
    }));
    // Prueba de validación: nombre demasiado corto
    test('should throw an error if name is too short', () => __awaiter(void 0, void 0, void 0, function* () {
        // Datos de prueba con nombre demasiado corto
        const createNeighborhoodDtoWithShortName = Object.assign(Object.assign({}, validCreateNeighborhoodDto), { name: 'Pa' }); // menos de 3 caracteres
        // Verificar que se lanza el error adecuado
        yield expect(createNeighborhoodUseCase.execute(createNeighborhoodDtoWithShortName))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createNeighborhoodUseCase.execute(createNeighborhoodDtoWithShortName))
            .rejects
            .toThrow('El nombre del barrio debe tener al menos 3 caracteres');
        // Verificar que no se ejecutaron otros métodos del repositorio
        expect(mockCityRepository.findById).not.toHaveBeenCalled();
        expect(mockNeighborhoodRepository.findByNameForCreate).not.toHaveBeenCalled();
        expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de ciudad no encontrada
    test('should throw an error if city is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que la ciudad no existe
        mockCityRepository.findById.mockRejectedValue(custom_error_1.CustomError.notFound('City not found'));
        // Verificar que se lanza el error adecuado
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toThrow('City not found');
        // Verificar que no se intentó crear el barrio
        expect(mockNeighborhoodRepository.findByNameForCreate).not.toHaveBeenCalled();
        expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de barrio duplicado
    test('should throw an error if neighborhood already exists in city', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que ya existe un barrio con ese nombre en la ciudad
        mockNeighborhoodRepository.findByNameForCreate.mockResolvedValue(mockNeighborhood);
        // Verificar que se lanza el error adecuado
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toThrow('Ya existe un barrio con este nombre en esta ciudad');
        // Verificar que no se intentó crear el barrio
        expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de error en la paginación
    test('should handle pagination error', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en PaginationDto.create
        jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue(['Pagination error', undefined]);
        // Ejecutar el caso de uso y verificar que maneja el error del DTO
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        // La ciudad debería verificarse primero antes de llegar a la paginación
        expect(mockCityRepository.findById).toHaveBeenCalled();
        // Pero no se debería intentar buscar o crear el barrio
        expect(mockNeighborhoodRepository.findByNameForCreate).not.toHaveBeenCalled();
        expect(mockNeighborhoodRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de manejo de errores del repositorio
    test('should handle repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en el repositorio de barrios
        const repositoryError = new Error('Database connection error');
        mockNeighborhoodRepository.create.mockRejectedValue(repositoryError);
        // Verificar que el error se transforma en un CustomError
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('create-neighborhood-use-case')
        });
    }));
    // Prueba de error específico del dominio
    test('should handle custom domain errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error específico del dominio
        const domainError = custom_error_1.CustomError.badRequest('Invalid neighborhood data');
        mockNeighborhoodRepository.create.mockRejectedValue(domainError);
        // Verificar que el error se propaga sin cambios
        yield expect(createNeighborhoodUseCase.execute(validCreateNeighborhoodDto))
            .rejects
            .toThrow(domainError);
    }));
});
