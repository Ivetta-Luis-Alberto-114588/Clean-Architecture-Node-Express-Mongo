"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/dtos/products/create-category.dto.test.ts
const create_category_1 = require("../../../../src/domain/dtos/products/create-category");
describe('CreateCategoryDto', () => {
    // Prueba de creación exitosa
    test('should create a valid DTO with correct values', () => {
        // Datos de prueba válidos
        const categoryData = {
            name: 'Test Category',
            description: 'Test category description',
            isActive: true
        };
        // Creación del DTO
        const [error, createCategoryDto] = create_category_1.CreateCategoryDto.create(categoryData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createCategoryDto).toBeInstanceOf(create_category_1.CreateCategoryDto);
        // Verificar valores correctos y transformaciones
        expect(createCategoryDto === null || createCategoryDto === void 0 ? void 0 : createCategoryDto.name).toBe('test category'); // debe estar en minúsculas
        expect(createCategoryDto === null || createCategoryDto === void 0 ? void 0 : createCategoryDto.description).toBe('test category description'); // debe estar en minúsculas
        expect(createCategoryDto === null || createCategoryDto === void 0 ? void 0 : createCategoryDto.isActive).toBe(true);
    });
    // Prueba de validación: nombre requerido
    test('should return error if name is not provided', () => {
        // Datos de prueba con nombre faltante
        const categoryData = {
            description: 'Test category description',
            isActive: true
        };
        // Creación del DTO
        const [error, createCategoryDto] = create_category_1.CreateCategoryDto.create(categoryData);
        // Verificaciones
        expect(error).toBe('name is required');
        expect(createCategoryDto).toBeUndefined();
    });
    // Prueba de validación: descripción requerida
    test('should return error if description is not provided', () => {
        // Datos de prueba con descripción faltante
        const categoryData = {
            name: 'Test Category',
            isActive: true
        };
        // Creación del DTO
        const [error, createCategoryDto] = create_category_1.CreateCategoryDto.create(categoryData);
        // Verificaciones
        expect(error).toBe('description is required');
        expect(createCategoryDto).toBeUndefined();
    });
    // Prueba de validación: isActive requerido
    test('should return error if isActive is not provided', () => {
        // Datos de prueba con isActive faltante
        const categoryData = {
            name: 'Test Category',
            description: 'Test category description'
        };
        // Creación del DTO
        const [error, createCategoryDto] = create_category_1.CreateCategoryDto.create(categoryData);
        // Verificaciones
        expect(error).toBe('isActive is required');
        expect(createCategoryDto).toBeUndefined();
    });
    // Prueba de valores vacíos
    test('should return error for empty values', () => {
        // Datos de prueba con valores vacíos
        const categoryData = {
            name: '',
            description: '',
            isActive: true
        };
        // Verificaciones - Si hay validación de cadenas vacías, debería fallar
        // Si no hay validación, se aceptarán cadenas vacías
        // Este test es para verificar el comportamiento actual
        const [error, createCategoryDto] = create_category_1.CreateCategoryDto.create(categoryData);
        expect(error).toBe('name is required'); // Suponiendo que cadenas vacías fallan la validación
        expect(createCategoryDto).toBeUndefined();
    });
    // Prueba de valores no booleanos para isActive
    test('should handle non-boolean isActive values', () => {
        // Datos de prueba con isActive no booleano
        const categoryData = {
            name: 'Test Category',
            description: 'Test category description',
            isActive: 'yes' // no es un booleano
        };
        // Creación del DTO
        const [error, createCategoryDto] = create_category_1.CreateCategoryDto.create(categoryData);
        // Verificaciones - Actualizadas para el nuevo mensaje de error
        expect(error).toBe('isActive debe ser un valor booleano');
        expect(createCategoryDto).toBeUndefined();
    });
    // Prueba de transformaciones de texto
    test('should convert name and description to lowercase', () => {
        // Datos de prueba con texto en mayúsculas
        const categoryData = {
            name: 'TEST CATEGORY',
            description: 'TEST CATEGORY DESCRIPTION',
            isActive: true
        };
        // Creación del DTO
        const [error, createCategoryDto] = create_category_1.CreateCategoryDto.create(categoryData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createCategoryDto).toBeInstanceOf(create_category_1.CreateCategoryDto);
        expect(createCategoryDto === null || createCategoryDto === void 0 ? void 0 : createCategoryDto.name).toBe('test category');
        expect(createCategoryDto === null || createCategoryDto === void 0 ? void 0 : createCategoryDto.description).toBe('test category description');
    });
});
