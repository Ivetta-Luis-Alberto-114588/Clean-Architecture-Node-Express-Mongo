"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_product_dto_1 = require("../../../../src/domain/dtos/products/create-product.dto");
const mongoose_1 = __importDefault(require("mongoose"));
describe('CreateProductDto', () => {
    // ID válido para pruebas
    const validCategoryId = new mongoose_1.default.Types.ObjectId().toString();
    const validUnitId = new mongoose_1.default.Types.ObjectId().toString();
    // Prueba de creación exitosa
    test('should create a valid DTO with correct values', () => {
        // Datos de prueba válidos
        const productData = {
            name: 'Test Product',
            description: 'Test product description',
            price: 100,
            stock: 10,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO
        const [error, createProductDto] = create_product_dto_1.CreateProductDto.create(productData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createProductDto).toBeInstanceOf(create_product_dto_1.CreateProductDto);
        // Verificar valores correctos y transformaciones
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.name).toBe('test product'); // debe estar en minúsculas
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.description).toBe('test product description'); // debe estar en minúsculas
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.price).toBe(100);
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.stock).toBe(10);
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.category).toBe(validCategoryId);
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.unit).toBe(validUnitId);
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.imgUrl).toBe('http://example.com/image.jpg');
        expect(createProductDto === null || createProductDto === void 0 ? void 0 : createProductDto.isActive).toBe(true);
    });
    // Prueba de validación: nombre requerido
    test('should return error if name is not provided', () => {
        // Datos de prueba con nombre faltante
        const productData = {
            description: 'Test product description',
            price: 100,
            stock: 10,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO
        const [error, createProductDto] = create_product_dto_1.CreateProductDto.create(productData);
        // Verificaciones
        expect(error).toBe('name is required');
        expect(createProductDto).toBeUndefined();
    });
    // Prueba de validación: descripción requerida
    test('should return error if description is not provided', () => {
        // Datos de prueba con descripción faltante
        const productData = {
            name: 'Test Product',
            price: 100,
            stock: 10,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO
        const [error, createProductDto] = create_product_dto_1.CreateProductDto.create(productData);
        // Verificaciones
        expect(error).toBe('description is required');
        expect(createProductDto).toBeUndefined();
    });
    // Prueba de validación: precio requerido y mayor que 0
    test('should return error if price is not provided or less than 0', () => {
        // Datos de prueba con precio faltante
        const productDataWithoutPrice = {
            name: 'Test Product',
            description: 'Test product description',
            stock: 10,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO sin precio
        const [errorWithoutPrice, dtoWithoutPrice] = create_product_dto_1.CreateProductDto.create(productDataWithoutPrice);
        // Verificaciones
        expect(errorWithoutPrice).toBe('price is required and greater than 0');
        expect(dtoWithoutPrice).toBeUndefined();
        // Datos de prueba con precio negativo
        const productDataWithNegativePrice = {
            name: 'Test Product',
            description: 'Test product description',
            price: -10,
            stock: 10,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO con precio negativo
        const [errorWithNegativePrice, dtoWithNegativePrice] = create_product_dto_1.CreateProductDto.create(productDataWithNegativePrice);
        // Verificaciones
        expect(errorWithNegativePrice).toBe('price is required and greater than 0');
        expect(dtoWithNegativePrice).toBeUndefined();
    });
    // Prueba de validación: stock requerido y mayor que 0
    test('should return error if stock is not provided or less than 0', () => {
        // Datos de prueba con stock faltante
        const productDataWithoutStock = {
            name: 'Test Product',
            description: 'Test product description',
            price: 100,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO sin stock
        const [errorWithoutStock, dtoWithoutStock] = create_product_dto_1.CreateProductDto.create(productDataWithoutStock);
        // Verificaciones
        expect(errorWithoutStock).toBe('stock is required and greater than 0');
        expect(dtoWithoutStock).toBeUndefined();
        // Datos de prueba con stock negativo
        const productDataWithNegativeStock = {
            name: 'Test Product',
            description: 'Test product description',
            price: 100,
            stock: -10,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO con stock negativo
        const [errorWithNegativeStock, dtoWithNegativeStock] = create_product_dto_1.CreateProductDto.create(productDataWithNegativeStock);
        // Verificaciones
        expect(errorWithNegativeStock).toBe('stock is required and greater than 0');
        expect(dtoWithNegativeStock).toBeUndefined();
    });
    // Prueba de validación: categoría requerida
    test('should return error if category is not provided', () => {
        // Datos de prueba con categoría faltante
        const productData = {
            name: 'Test Product',
            description: 'Test product description',
            price: 100,
            stock: 10,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO
        const [error, createProductDto] = create_product_dto_1.CreateProductDto.create(productData);
        // Verificaciones
        expect(error).toBe('category is required');
        expect(createProductDto).toBeUndefined();
    });
    // Prueba de validación: unidad requerida
    test('should return error if unit is not provided', () => {
        // Datos de prueba con unidad faltante
        const productData = {
            name: 'Test Product',
            description: 'Test product description',
            price: 100,
            stock: 10,
            category: validCategoryId,
            imgUrl: 'http://example.com/image.jpg',
            isActive: true
        };
        // Creación del DTO
        const [error, createProductDto] = create_product_dto_1.CreateProductDto.create(productData);
        // Verificaciones
        expect(error).toBe('unit is required');
        expect(createProductDto).toBeUndefined();
    });
    // Prueba de validación: imagen URL requerida
    test('should return error if imgUrl is not provided', () => {
        // Datos de prueba con imagen URL faltante
        const productData = {
            name: 'Test Product',
            description: 'Test product description',
            price: 100,
            stock: 10,
            category: validCategoryId,
            unit: validUnitId,
            isActive: true
        };
        // Creación del DTO
        const [error, createProductDto] = create_product_dto_1.CreateProductDto.create(productData);
        // Verificaciones
        expect(error).toBe('imgUrl is required');
        expect(createProductDto).toBeUndefined();
    });
    // Prueba de validación: isActive requerido
    test('should return error if isActive is not provided', () => {
        // Datos de prueba con isActive faltante
        const productData = {
            name: 'Test Product',
            description: 'Test product description',
            price: 100,
            stock: 10,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/image.jpg'
        };
        // Creación del DTO
        const [error, createProductDto] = create_product_dto_1.CreateProductDto.create(productData);
        // Verificaciones
        expect(error).toBe('isActive is required');
        expect(createProductDto).toBeUndefined();
    });
});
