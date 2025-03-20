"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_city_dto_1 = require("../../../../src/domain/dtos/customers/create-city.dto");
describe('CreateCityDto', () => {
    // Prueba de creación exitosa
    test('should create a valid DTO with correct values', () => {
        // Datos de prueba válidos
        const cityData = {
            name: 'Buenos Aires',
            description: 'Capital de Argentina',
            isActive: true
        };
        // Creación del DTO
        const [error, createCityDto] = create_city_dto_1.CreateCityDto.create(cityData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createCityDto).toBeInstanceOf(create_city_dto_1.CreateCityDto);
        // Verificar valores correctos y transformaciones
        expect(createCityDto === null || createCityDto === void 0 ? void 0 : createCityDto.name).toBe('buenos aires'); // debe estar en minúsculas
        expect(createCityDto === null || createCityDto === void 0 ? void 0 : createCityDto.description).toBe('capital de argentina'); // debe estar en minúsculas
        expect(createCityDto === null || createCityDto === void 0 ? void 0 : createCityDto.isActive).toBe(true);
    });
    // Prueba de validación: nombre requerido
    test('should return error if name is not provided', () => {
        // Datos de prueba con nombre faltante
        const cityData = {
            description: 'Capital de Argentina'
        };
        // Creación del DTO
        const [error, createCityDto] = create_city_dto_1.CreateCityDto.create(cityData);
        // Verificaciones
        expect(error).toBe('name is required');
        expect(createCityDto).toBeUndefined();
    });
    // Prueba de validación: longitud mínima del nombre
    test('should return error if name is too short', () => {
        // Datos de prueba con nombre demasiado corto
        const cityData = {
            name: 'BA', // menos de 3 caracteres
            description: 'Capital de Argentina'
        };
        // Creación del DTO
        const [error, createCityDto] = create_city_dto_1.CreateCityDto.create(cityData);
        // Verificaciones
        expect(error).toBe('name debe tener al menos 3 caracteres');
        expect(createCityDto).toBeUndefined();
    });
    // Prueba de validación: descripción requerida
    test('should return error if description is not provided', () => {
        // Datos de prueba con descripción faltante
        const cityData = {
            name: 'Buenos Aires'
        };
        // Creación del DTO
        const [error, createCityDto] = create_city_dto_1.CreateCityDto.create(cityData);
        // Verificaciones
        expect(error).toBe('description es requiredo');
        expect(createCityDto).toBeUndefined();
    });
    // Prueba de validación: valor por defecto de isActive
    test('should set isActive to true by default if not provided', () => {
        // Datos de prueba sin isActive
        const cityData = {
            name: 'Buenos Aires',
            description: 'Capital de Argentina'
        };
        // Creación del DTO
        const [error, createCityDto] = create_city_dto_1.CreateCityDto.create(cityData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createCityDto).toBeInstanceOf(create_city_dto_1.CreateCityDto);
        expect(createCityDto === null || createCityDto === void 0 ? void 0 : createCityDto.isActive).toBe(true); // valor por defecto
    });
    // Prueba de validación: isActive debe ser booleano
    test('should return error if isActive is not a boolean', () => {
        // Datos de prueba con isActive no booleano
        const cityData = {
            name: 'Buenos Aires',
            description: 'Capital de Argentina',
            isActive: 'yes' // no es booleano
        };
        // Creación del DTO
        const [error, createCityDto] = create_city_dto_1.CreateCityDto.create(cityData);
        // Verificaciones
        expect(error).toBe('isActive debe ser un valor booleano');
        expect(createCityDto).toBeUndefined();
    });
});
