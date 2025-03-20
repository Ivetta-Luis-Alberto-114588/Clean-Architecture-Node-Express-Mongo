"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_product_dto_1 = require("../../../../src/domain/dtos/products/update-product.dto");
const mongoose_1 = __importDefault(require("mongoose"));
describe('UpdateProductDto', () => {
    // ID válido para pruebas
    const validCategoryId = new mongoose_1.default.Types.ObjectId().toString();
    const validUnitId = new mongoose_1.default.Types.ObjectId().toString();
    // Prueba de actualización exitosa con todos los campos
    test('should create a valid DTO with all fields', () => {
        // Datos de prueba válidos
        const updateData = {
            name: 'Updated Product',
            description: 'Updated product description',
            price: 200,
            stock: 20,
            category: validCategoryId,
            unit: validUnitId,
            imgUrl: 'http://example.com/updated-image.jpg',
            isActive: false
        };
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateProductDto).toBeInstanceOf(update_product_dto_1.UpdateProductDto);
        // Verificar valores correctos y transformaciones
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.name).toBe('updated product'); // debe estar en minúsculas
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.description).toBe('updated product description'); // debe estar en minúsculas
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.price).toBe(200);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.stock).toBe(20);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.category).toBe(validCategoryId);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.unit).toBe(validUnitId);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.imgUrl).toBe('http://example.com/updated-image.jpg');
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.isActive).toBe(false);
    });
    // Prueba de actualización exitosa con solo algunos campos
    test('should create a valid DTO with partial fields', () => {
        // Datos de prueba con solo algunos campos
        const updateData = {
            name: 'Updated Product Name',
            price: 150
        };
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateProductDto).toBeInstanceOf(update_product_dto_1.UpdateProductDto);
        // Verificar valores correctos y transformaciones
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.name).toBe('updated product name'); // debe estar en minúsculas
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.price).toBe(150);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.description).toBeUndefined(); // no se proporcionó
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.stock).toBeUndefined(); // no se proporcionó
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.category).toBeUndefined(); // no se proporcionó
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.unit).toBeUndefined(); // no se proporcionó
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.imgUrl).toBeUndefined(); // no se proporcionó
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.isActive).toBeUndefined(); // no se proporcionó
    });
    // Prueba de validación: objeto vacío
    test('should return error if no update fields are provided', () => {
        // Datos de prueba vacíos
        const updateData = {};
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBe('At least one field is required for update');
        expect(updateProductDto).toBeUndefined();
    });
    // Prueba de validación: precio negativo
    test('should return error if price is negative', () => {
        // Datos de prueba con precio negativo
        const updateData = {
            price: -50
        };
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBe('Price must be greater than or equal to 0');
        expect(updateProductDto).toBeUndefined();
    });
    // Prueba de validación: stock negativo
    test('should return error if stock is negative', () => {
        // Datos de prueba con stock negativo
        const updateData = {
            stock: -10
        };
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBe('Stock must be greater than or equal to 0');
        expect(updateProductDto).toBeUndefined();
    });
    // Prueba de actualización con múltiples campos
    test('should update multiple fields correctly', () => {
        // Datos de prueba con múltiples campos
        const updateData = {
            name: 'Multiple Update',
            price: 300,
            stock: 30,
            isActive: true
        };
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateProductDto).toBeInstanceOf(update_product_dto_1.UpdateProductDto);
        // Verificar valores correctos
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.name).toBe('multiple update');
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.price).toBe(300);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.stock).toBe(30);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.isActive).toBe(true);
    });
    // Prueba con precio cero
    test('should accept zero price', () => {
        // Datos de prueba con precio cero
        const updateData = {
            price: 0
        };
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateProductDto).toBeInstanceOf(update_product_dto_1.UpdateProductDto);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.price).toBe(0);
    });
    // Prueba con stock cero
    test('should accept zero stock', () => {
        // Datos de prueba con stock cero
        const updateData = {
            stock: 0
        };
        // Creación del DTO
        const [error, updateProductDto] = update_product_dto_1.UpdateProductDto.create(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateProductDto).toBeInstanceOf(update_product_dto_1.UpdateProductDto);
        expect(updateProductDto === null || updateProductDto === void 0 ? void 0 : updateProductDto.stock).toBe(0);
    });
});
