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
// tests/domain/use-cases/customers/create-city.use-case.test.ts
const create_city_use_case_1 = require("../../../../src/domain/use-cases/customers/create-city.use-case");
const create_city_dto_1 = require("../../../../src/domain/dtos/customers/create-city.dto");
const citiy_1 = require("../../../../src/domain/entities/customers/citiy");
const pagination_dto_1 = require("../../../../src/domain/dtos/shared/pagination.dto");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
describe('CreateCityUseCase', () => {
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
    // Inicialización del caso de uso a probar
    let createCityUseCase;
    // Datos de prueba
    const validCityData = {
        name: 'Buenos Aires',
        description: 'Capital de Argentina',
        isActive: true
    };
    // Crear el DTO usando el método estático create
    const [error, validCreateCityDto] = create_city_dto_1.CreateCityDto.create(validCityData);
    // Verificar que no hay error y el DTO se creó correctamente
    if (error || !validCreateCityDto) {
        throw new Error(`Failed to create test CreateCityDto: ${error}`);
    }
    // Ciudad de respuesta simulada
    const mockCityEntity = new citiy_1.CityEntity(1, // ID de ciudad
    'buenos aires', 'capital de argentina', true);
    // PaginationDto mock para las pruebas
    const mockPaginationDto = { page: 1, limit: 1 };
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.resetAllMocks();
        createCityUseCase = new create_city_use_case_1.CreateCityUseCase(mockCityRepository);
        // Configurar el comportamiento por defecto de los mocks
        mockCityRepository.findByNameForCreate.mockResolvedValue(null); // La ciudad no existe
        mockCityRepository.create.mockResolvedValue(mockCityEntity);
        // Mock para PaginationDto.create
        jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue([undefined, mockPaginationDto]);
    });
    // Prueba del flujo exitoso
    test('should create a city successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield createCityUseCase.execute(validCreateCityDto);
        // Verificaciones
        expect(mockCityRepository.findByNameForCreate).toHaveBeenCalledWith(validCreateCityDto.name, mockPaginationDto);
        expect(mockCityRepository.create).toHaveBeenCalledWith(validCreateCityDto);
        expect(result).toEqual(mockCityEntity);
    }));
    // Prueba de validación: nombre demasiado corto
    test('should throw an error if name is too short', () => __awaiter(void 0, void 0, void 0, function* () {
        // Datos de prueba con nombre demasiado corto
        const createCityDtoWithShortName = Object.assign(Object.assign({}, validCreateCityDto), { name: 'AB' }); // menos de 3 caracteres
        // Verificar que se lanza el error adecuado
        yield expect(createCityUseCase.execute(createCityDtoWithShortName))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createCityUseCase.execute(createCityDtoWithShortName))
            .rejects
            .toThrow('City name must have at least 3 characters');
        // Verificar que no se ejecutaron otros métodos del repositorio
        expect(mockCityRepository.findByNameForCreate).not.toHaveBeenCalled();
        expect(mockCityRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de ciudad ya existente
    test('should throw an error if city already exists', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que la ciudad ya existe
        mockCityRepository.findByNameForCreate.mockResolvedValue(mockCityEntity);
        // Verificar que se lanza el error adecuado
        yield expect(createCityUseCase.execute(validCreateCityDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createCityUseCase.execute(validCreateCityDto))
            .rejects
            .toThrow('City with this name already exists');
        // Verificar que no se intentó crear la ciudad
        expect(mockCityRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de error en la paginación
    test('should handle pagination error', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en PaginationDto.create
        jest.spyOn(pagination_dto_1.PaginationDto, 'create').mockReturnValue(['Pagination error', undefined]);
        // Verificar que se lanza el error adecuado
        yield expect(createCityUseCase.execute(validCreateCityDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        // Verificar que no se ejecutaron otros métodos del repositorio
        expect(mockCityRepository.findByNameForCreate).not.toHaveBeenCalled();
        expect(mockCityRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de manejo de errores del repositorio
    test('should handle repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en el repositorio
        const repositoryError = new Error('Database connection error');
        mockCityRepository.findByNameForCreate.mockRejectedValue(repositoryError);
        // Verificar que el error se transforma en un CustomError
        yield expect(createCityUseCase.execute(validCreateCityDto))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield expect(createCityUseCase.execute(validCreateCityDto))
            .rejects
            .toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('create-city-use-case')
        });
    }));
    // Prueba de error específico del dominio
    test('should handle custom domain errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error específico del dominio
        const domainError = custom_error_1.CustomError.badRequest('Invalid city data');
        mockCityRepository.findByNameForCreate.mockRejectedValue(domainError);
        // Verificar que el error se propaga sin cambios
        yield expect(createCityUseCase.execute(validCreateCityDto))
            .rejects
            .toThrow(domainError);
    }));
});
