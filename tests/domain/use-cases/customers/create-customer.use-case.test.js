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
// tests/domain/use-cases/customers/create-customer.use-case.test.ts
const create_customer_use_case_1 = require("../../../../src/domain/use-cases/customers/create-customer.use-case");
const create_customer_dto_1 = require("../../../../src/domain/dtos/customers/create-customer.dto");
const customer_1 = require("../../../../src/domain/entities/customers/customer");
const neighborhood_1 = require("../../../../src/domain/entities/customers/neighborhood");
const citiy_1 = require("../../../../src/domain/entities/customers/citiy");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
const mongoose_1 = __importDefault(require("mongoose"));
describe('CreateCustomerUseCase', () => {
    // Mocks de los repositorios
    const mockCustomerRepository = {
        create: jest.fn(),
        getAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByEmail: jest.fn(),
        findByNeighborhood: jest.fn()
    };
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
    // Inicialización del caso de uso a probar
    let createCustomerUseCase;
    // Datos de prueba
    const validNeighborhoodId = new mongoose_1.default.Types.ObjectId().toString();
    const validCustomerData = {
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        phone: '+5491123456789',
        address: 'Av. Corrientes 1234',
        neighborhoodId: validNeighborhoodId,
        isActive: true
    };
    // Crear el DTO usando el método estático create
    const [error, validCreateCustomerDto] = create_customer_dto_1.CreateCustomerDto.create(validCustomerData);
    // Verificar que no hay error y el DTO se creó correctamente
    if (error || !validCreateCustomerDto) {
        throw new Error(`Failed to create test CreateCustomerDto: ${error}`);
    }
    // Mocks de entidades para las pruebas
    const mockCity = new citiy_1.CityEntity(1, 'Buenos Aires', 'Capital de Argentina', true);
    const mockNeighborhood = new neighborhood_1.NeighborhoodEntity(2, 'Palermo', 'Barrio turístico', mockCity, true);
    const mockCustomerEntity = new customer_1.CustomerEntity(3, 'juan pérez', 'juan.perez@example.com', '+5491123456789', 'av. corrientes 1234', mockNeighborhood, true);
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.resetAllMocks();
        createCustomerUseCase = new create_customer_use_case_1.CreateCustomerUseCase(mockCustomerRepository, mockNeighborhoodRepository);
        // Configurar el comportamiento por defecto de los mocks
        mockNeighborhoodRepository.findById.mockResolvedValue(mockNeighborhood);
        mockCustomerRepository.findByEmail.mockResolvedValue(null); // El cliente no existe
        mockCustomerRepository.create.mockResolvedValue(mockCustomerEntity);
    });
    // Prueba del flujo exitoso
    test('should create a customer successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield createCustomerUseCase.execute(validCreateCustomerDto);
        // Verificaciones
        expect(mockNeighborhoodRepository.findById).toHaveBeenCalledWith(validNeighborhoodId);
        expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(validCreateCustomerDto.email);
        expect(mockCustomerRepository.create).toHaveBeenCalledWith(validCreateCustomerDto);
        expect(result).toEqual(mockCustomerEntity);
    }));
    // Prueba de validación: nombre demasiado corto
    test('should throw an error if name is too short', () => __awaiter(void 0, void 0, void 0, function* () {
        // Datos de prueba con nombre demasiado corto
        const createCustomerDtoWithShortName = Object.assign(Object.assign({}, validCreateCustomerDto), { name: 'Ju' }); // menos de 3 caracteres
        // Verificar que se lanza el error adecuado
        yield expect(createCustomerUseCase.execute(createCustomerDtoWithShortName))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createCustomerUseCase.execute(createCustomerDtoWithShortName))
            .rejects
            .toThrow('El nombre del cliente debe tener al menos 3 caracteres');
        // Verificar que no se ejecutaron otros métodos del repositorio
        expect(mockNeighborhoodRepository.findById).not.toHaveBeenCalled();
        expect(mockCustomerRepository.findByEmail).not.toHaveBeenCalled();
        expect(mockCustomerRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de barrio no encontrado
    test('should throw an error if neighborhood is not found', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que el barrio no existe
        mockNeighborhoodRepository.findById.mockRejectedValue(custom_error_1.CustomError.notFound('Neighborhood not found'));
        // Verificar que se lanza el error adecuado
        yield expect(createCustomerUseCase.execute(validCreateCustomerDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createCustomerUseCase.execute(validCreateCustomerDto))
            .rejects
            .toThrow('Neighborhood not found');
        // Verificar que no se intentó crear el cliente
        expect(mockCustomerRepository.findByEmail).not.toHaveBeenCalled();
        expect(mockCustomerRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de email duplicado
    test('should throw an error if email already exists', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que ya existe un cliente con ese email
        mockCustomerRepository.findByEmail.mockResolvedValue(mockCustomerEntity);
        // Verificar que se lanza el error adecuado
        yield expect(createCustomerUseCase.execute(validCreateCustomerDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        yield expect(createCustomerUseCase.execute(validCreateCustomerDto))
            .rejects
            .toThrow('Ya existe un cliente con este email');
        // Verificar que no se intentó crear el cliente
        expect(mockCustomerRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de manejo de errores del repositorio
    test('should handle repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en el repositorio de clientes
        const repositoryError = new Error('Database connection error');
        mockCustomerRepository.create.mockRejectedValue(repositoryError);
        // Verificar que el error se transforma en un CustomError
        yield expect(createCustomerUseCase.execute(validCreateCustomerDto))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield expect(createCustomerUseCase.execute(validCreateCustomerDto))
            .rejects
            .toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('create-customer-use-case')
        });
    }));
    // Prueba de error específico del dominio
    test('should handle custom domain errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error específico del dominio
        const domainError = custom_error_1.CustomError.badRequest('Invalid customer data');
        mockNeighborhoodRepository.findById.mockRejectedValue(domainError);
        // Verificar que el error se propaga sin cambios
        yield expect(createCustomerUseCase.execute(validCreateCustomerDto))
            .rejects
            .toThrow(domainError);
    }));
});
