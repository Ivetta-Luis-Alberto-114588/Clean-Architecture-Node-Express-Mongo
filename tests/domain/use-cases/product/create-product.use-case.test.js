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
// tests/domain/use-cases/product/create-product.use-case.test.ts
const create_product_use_case_1 = require("../../../../src/domain/use-cases/product/create-product.use-case");
const create_product_dto_1 = require("../../../../src/domain/dtos/products/create-product.dto");
const product_entity_1 = require("../../../../src/domain/entities/products/product.entity");
const category_entity_1 = require("../../../../src/domain/entities/products/category.entity");
const unit_entity_1 = require("../../../../src/domain/entities/products/unit.entity");
const custom_error_1 = require("../../../../src/domain/errors/custom.error");
describe('CreateProductUseCase', () => {
    // Mock del ProductRepository
    const mockProductRepository = {
        create: jest.fn(),
        getAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByNameForCreate: jest.fn(),
        findByName: jest.fn(),
        findByCategory: jest.fn(),
        findByUnit: jest.fn()
    };
    // Inicialización del caso de uso a probar
    let createProductUseCase;
    // Datos de prueba
    const validProductData = {
        name: 'test product',
        description: 'test product description',
        price: 100,
        stock: 10,
        category: 'category-id', // ID de la categoría
        unit: 'unit-id', // ID de la unidad
        imgUrl: 'http://example.com/image.jpg',
        isActive: true
    };
    // Crear el DTO usando el método estático create (que es la forma correcta)
    const [error, validCreateProductDto] = create_product_dto_1.CreateProductDto.create(validProductData);
    // Verificar que no hay error y el DTO se creó correctamente
    if (error || !validCreateProductDto) {
        throw new Error(`Failed to create test CreateProductDto: ${error}`);
    }
    // Entidades mock para la respuesta
    const mockCategory = new category_entity_1.CategoryEntity(1, // ID de categoría
    'test category', 'test category description', true);
    const mockUnit = new unit_entity_1.UnitEntity(1, // ID de unidad
    'test unit', 'test unit description', true);
    // Producto de respuesta simulado
    const mockProductEntity = new product_entity_1.ProductEntity(1, // ID de producto
    'test product', 100, 10, mockCategory, mockUnit, 'http://example.com/image.jpg', true, 'test product description');
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.resetAllMocks();
        createProductUseCase = new create_product_use_case_1.CreateProductUseCase(mockProductRepository);
        // Configurar el comportamiento por defecto de los mocks
        mockProductRepository.findByNameForCreate.mockResolvedValue(null); // El producto no existe
        mockProductRepository.create.mockResolvedValue(mockProductEntity);
    });
    // Prueba del flujo exitoso
    test('should create a product successfully', () => __awaiter(void 0, void 0, void 0, function* () {
        // Ejecutar el caso de uso
        const result = yield createProductUseCase.execute(validCreateProductDto);
        // Verificaciones
        expect(mockProductRepository.findByNameForCreate).toHaveBeenCalledWith(validCreateProductDto.name, expect.any(Object) // La paginación
        );
        expect(mockProductRepository.create).toHaveBeenCalledWith(validCreateProductDto);
        expect(result).toEqual(mockProductEntity);
    }));
    // Prueba de producto ya existente
    test('should throw an error if product already exists', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular que el producto ya existe
        mockProductRepository.findByNameForCreate.mockResolvedValue(mockProductEntity);
        // Verificar que se lanza el error adecuado
        yield expect(createProductUseCase.execute(validCreateProductDto))
            .rejects
            .toThrow(custom_error_1.CustomError);
        // Verificar el mensaje específico
        yield expect(createProductUseCase.execute(validCreateProductDto))
            .rejects
            .toThrow('create-product-use-case, product already exist');
        // Verificar que no se intentó crear el producto
        expect(mockProductRepository.create).not.toHaveBeenCalled();
    }));
    // Prueba de manejo de errores del repositorio
    test('should handle repository errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error en el repositorio
        const repositoryError = new Error('Database connection error');
        mockProductRepository.findByNameForCreate.mockRejectedValue(repositoryError);
        // Verificar que el error se transforma en un CustomError
        yield expect(createProductUseCase.execute(validCreateProductDto))
            .rejects
            .toBeInstanceOf(custom_error_1.CustomError);
        yield expect(createProductUseCase.execute(validCreateProductDto))
            .rejects
            .toMatchObject({
            statusCode: 500,
            message: expect.stringContaining('create-product-use-case')
        });
    }));
    // Prueba de error específico del dominio
    test('should handle custom domain errors', () => __awaiter(void 0, void 0, void 0, function* () {
        // Simular un error específico del dominio
        const domainError = custom_error_1.CustomError.badRequest('Invalid product data');
        mockProductRepository.findByNameForCreate.mockRejectedValue(domainError);
        // Verificar que el error se propaga sin cambios
        yield expect(createProductUseCase.execute(validCreateProductDto))
            .rejects
            .toThrow(domainError);
    }));
});
