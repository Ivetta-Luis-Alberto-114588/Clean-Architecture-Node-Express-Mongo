"use strict";
// tests/presentation/products/controller.product.test.ts
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
// Modificaciones principales:
// 1. Asegurarnos de esperar correctamente las promesas en tests asíncronos
// 2. Corregir la configuración de los mocks
// 3. Asegurar que los datos de prueba sean válidos
const controller_product_1 = require("../../../src/presentation/products/controller.product");
const product_entity_1 = require("../../../src/domain/entities/products/product.entity");
const category_entity_1 = require("../../../src/domain/entities/products/category.entity");
const unit_entity_1 = require("../../../src/domain/entities/products/unit.entity");
const custom_error_1 = require("../../../src/domain/errors/custom.error");
const test_utils_1 = require("../../utils/test-utils");
const pagination_dto_1 = require("../../../src/domain/dtos/shared/pagination.dto");
// Mock de las funciones execute para los casos de uso
const mockCreateExecute = jest.fn();
const mockGetAllExecute = jest.fn();
const mockDeleteExecute = jest.fn();
const mockGetByCategoryExecute = jest.fn();
const mockUpdateExecute = jest.fn();
// Mock de los módulos de los casos de uso
jest.mock('../../../src/domain/use-cases/product/create-product.use-case', () => {
    return {
        CreateProductUseCase: jest.fn().mockImplementation(() => ({
            execute: mockCreateExecute
        }))
    };
});
jest.mock('../../../src/domain/use-cases/product/get-all-products.use-case', () => {
    return {
        GetAllProductsUseCase: jest.fn().mockImplementation(() => ({
            execute: mockGetAllExecute
        }))
    };
});
jest.mock('../../../src/domain/use-cases/product/delete-product.use-case', () => {
    return {
        DeleteProductUseCase: jest.fn().mockImplementation(() => ({
            execute: mockDeleteExecute
        }))
    };
});
jest.mock('../../../src/domain/use-cases/product/get-product-by-category.use-case', () => {
    return {
        GetProductByCategoryUseCase: jest.fn().mockImplementation(() => ({
            execute: mockGetByCategoryExecute
        }))
    };
});
jest.mock('../../../src/domain/use-cases/product/update-product.use-case', () => {
    return {
        UpdateProductUseCase: jest.fn().mockImplementation(() => ({
            execute: mockUpdateExecute
        }))
    };
});
// Mock de PaginationDto.create
jest.mock('../../../src/domain/dtos/shared/pagination.dto', () => {
    return Object.assign(Object.assign({}, jest.requireActual('../../../src/domain/dtos/shared/pagination.dto')), { PaginationDto: {
            create: jest.fn().mockImplementation((page, limit) => {
                // Simulamos la validación real pero con valores predeterminados para tests
                if (page && limit) {
                    return [undefined, { page, limit }];
                }
                return [undefined, { page: 1, limit: 5 }];
            })
        } });
});
// Importar después de los mocks
const create_product_use_case_1 = require("../../../src/domain/use-cases/product/create-product.use-case");
const get_all_products_use_case_1 = require("../../../src/domain/use-cases/product/get-all-products.use-case");
const get_product_by_category_use_case_1 = require("../../../src/domain/use-cases/product/get-product-by-category.use-case");
describe('ProductController', () => {
    // Mocks de los repositorios
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
    const mockCategoryRepository = {
        create: jest.fn(),
        getAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByName: jest.fn(),
        findByNameForCreate: jest.fn()
    };
    // Instancia del controlador a probar
    let productController;
    // Entidades mock para pruebas
    const mockCategory = new category_entity_1.CategoryEntity(1, 'test category', 'test category description', true);
    const mockUnit = new unit_entity_1.UnitEntity(1, 'test unit', 'test unit description', true);
    // Producto de prueba
    const mockProduct = new product_entity_1.ProductEntity(1, 'test product', 100, 10, mockCategory, mockUnit, 'http://example.com/image.jpg', true, 'test product description');
    // Datos de prueba para crear un producto
    const validProductData = {
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        stock: 10,
        category: 'category-id',
        unit: 'unit-id',
        imgUrl: 'http://example.com/image.jpg',
        isActive: true
    };
    // Configuración previa a cada prueba
    beforeEach(() => {
        jest.clearAllMocks();
        // Limpiar mocks de execute
        mockCreateExecute.mockClear();
        mockGetAllExecute.mockClear();
        mockDeleteExecute.mockClear();
        mockGetByCategoryExecute.mockClear();
        mockUpdateExecute.mockClear();
        // Configurar valores por defecto
        mockCreateExecute.mockResolvedValue(mockProduct);
        mockGetAllExecute.mockResolvedValue([mockProduct]);
        mockDeleteExecute.mockResolvedValue(mockProduct);
        mockGetByCategoryExecute.mockResolvedValue([mockProduct]);
        mockUpdateExecute.mockResolvedValue(mockProduct);
        productController = new controller_product_1.ProductController(mockProductRepository, mockCategoryRepository);
    });
    describe('createProduct', () => {
        // Prueba de creación exitosa
        test('should create a product successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: validProductData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            productController.createProduct(req, res);
            // Esperar a que se resuelvan las promesas
            yield new Promise(process.nextTick);
            // Verificaciones
            expect(create_product_use_case_1.CreateProductUseCase).toHaveBeenCalledWith(mockProductRepository);
            expect(mockCreateExecute).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockProduct);
            expect(res.status).not.toHaveBeenCalled();
        }));
        // Prueba de datos inválidos
        test('should return 400 when product data is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Crear datos inválidos directamente sin la propiedad name
            const invalidData = {
                description: validProductData.description,
                price: validProductData.price,
                stock: validProductData.stock,
                category: validProductData.category,
                unit: validProductData.unit,
                imgUrl: validProductData.imgUrl,
                isActive: validProductData.isActive
            };
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: invalidData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            productController.createProduct(req, res);
            // Esperar a que se resuelvan las promesas
            yield new Promise(process.nextTick);
            // Verificaciones
            expect(create_product_use_case_1.CreateProductUseCase).not.toHaveBeenCalled();
            expect(mockCreateExecute).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
        }));
        // Prueba de manejo de errores del caso de uso
        test('should handle use case errors during product creation', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simular un error en el caso de uso
            const customError = custom_error_1.CustomError.badRequest('Product already exists');
            mockCreateExecute.mockRejectedValue(customError);
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ body: validProductData });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador y manejar la promesa
            yield productController.createProduct(req, res);
            // Verificaciones
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Product already exists' });
        }));
    });
    describe('getAllProducts', () => {
        // Prueba de obtención exitosa
        test('should get all products successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Preparar request y response con valores válidos
            const req = (0, test_utils_1.mockRequest)({ query: { page: '1', limit: '10' } });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            yield productController.getAllProducts(req, res);
            // Verificaciones
            expect(get_all_products_use_case_1.GetAllProductsUseCase).toHaveBeenCalledWith(mockProductRepository);
            expect(mockGetAllExecute).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith([mockProduct]);
            expect(res.status).not.toHaveBeenCalled();
        }));
        // Prueba con valores predeterminados
        test('should use default pagination when no parameters are provided', () => __awaiter(void 0, void 0, void 0, function* () {
            // Preparar request sin parámetros
            const req = (0, test_utils_1.mockRequest)({ query: {} });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            yield productController.getAllProducts(req, res);
            // Verificaciones
            expect(get_all_products_use_case_1.GetAllProductsUseCase).toHaveBeenCalledWith(mockProductRepository);
            expect(mockGetAllExecute).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith([mockProduct]);
            expect(res.status).not.toHaveBeenCalled();
        }));
        // Prueba de manejo de error para parámetros de paginación inválidos
        test('should handle invalid pagination parameters gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Mockear PaginationDto.create para devolver un error
            pagination_dto_1.PaginationDto.create.mockReturnValueOnce(['Invalid pagination', undefined]);
            // Preparar request con parámetros que no se pueden convertir a número
            const req = (0, test_utils_1.mockRequest)({ query: { page: 'invalid', limit: 'invalid' } });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            yield productController.getAllProducts(req, res);
            // Verificaciones
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid pagination' });
            expect(get_all_products_use_case_1.GetAllProductsUseCase).not.toHaveBeenCalled();
            expect(mockGetAllExecute).not.toHaveBeenCalled();
        }));
        // Prueba de manejo de errores del caso de uso
        test('should handle use case errors when getting all products', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simular un error en el caso de uso
            const customError = custom_error_1.CustomError.internalServerError('Database error');
            mockGetAllExecute.mockRejectedValue(customError);
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({ query: { page: '1', limit: '10' } });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            yield productController.getAllProducts(req, res);
            // Verificaciones
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
        }));
    });
    describe('getProductsByCategory', () => {
        // Prueba de obtención exitosa
        test('should get products by category successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({
                params: { categoryId: 'category-id' },
                query: { page: '1', limit: '10' }
            });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            yield productController.getProductsByCategory(req, res);
            // Verificaciones
            expect(get_product_by_category_use_case_1.GetProductByCategoryUseCase).toHaveBeenCalledWith(mockProductRepository, mockCategoryRepository);
            expect(mockGetByCategoryExecute).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith([mockProduct]);
            expect(res.status).not.toHaveBeenCalled();
        }));
        // Prueba de manejo de errores del caso de uso
        test('should handle use case errors when getting products by category', () => __awaiter(void 0, void 0, void 0, function* () {
            // Simular un error en el caso de uso
            const customError = custom_error_1.CustomError.notFound('Category not found');
            mockGetByCategoryExecute.mockRejectedValue(customError);
            // Preparar request y response
            const req = (0, test_utils_1.mockRequest)({
                params: { categoryId: 'nonexistent-id' },
                query: { page: '1', limit: '10' }
            });
            const res = (0, test_utils_1.mockResponse)();
            // Ejecutar el controlador
            yield productController.getProductsByCategory(req, res);
            // Verificaciones
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
        }));
    });
});
