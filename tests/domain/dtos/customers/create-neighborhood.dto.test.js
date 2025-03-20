"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_neighborhood_dto_1 = require("../../../../src/domain/dtos/customers/create-neighborhood.dto");
const mongoose_1 = __importDefault(require("mongoose"));
describe('CreateNeighborhoodDto', () => {
    // ID válido para pruebas
    const validCityId = new mongoose_1.default.Types.ObjectId().toString();
    // Prueba de creación exitosa
    test('should create a valid DTO with correct values', () => {
        // Datos de prueba válidos
        const neighborhoodData = {
            name: 'Palermo',
            description: 'Barrio turístico',
            cityId: validCityId,
            isActive: true
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createNeighborhoodDto).toBeInstanceOf(create_neighborhood_dto_1.CreateNeighborhoodDto);
        // Verificar valores correctos y transformaciones
        expect(createNeighborhoodDto === null || createNeighborhoodDto === void 0 ? void 0 : createNeighborhoodDto.name).toBe('palermo'); // debe estar en minúsculas
        expect(createNeighborhoodDto === null || createNeighborhoodDto === void 0 ? void 0 : createNeighborhoodDto.description).toBe('barrio turístico'); // debe estar en minúsculas
        expect(createNeighborhoodDto === null || createNeighborhoodDto === void 0 ? void 0 : createNeighborhoodDto.cityId).toBe(validCityId);
        expect(createNeighborhoodDto === null || createNeighborhoodDto === void 0 ? void 0 : createNeighborhoodDto.isActive).toBe(true);
    });
    // Prueba de validación: nombre requerido
    test('should return error if name is not provided', () => {
        // Datos de prueba con nombre faltante
        const neighborhoodData = {
            description: 'Barrio turístico',
            cityId: validCityId
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBe('name es requiredo');
        expect(createNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: longitud mínima del nombre
    test('should return error if name is too short', () => {
        // Datos de prueba con nombre demasiado corto
        const neighborhoodData = {
            name: 'Pa', // menos de 3 caracteres
            description: 'Barrio turístico',
            cityId: validCityId
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBe('name debe tener al menos 2 caracteres');
        expect(createNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: descripción requerida
    test('should return error if description is not provided', () => {
        // Datos de prueba con descripción faltante
        const neighborhoodData = {
            name: 'Palermo',
            cityId: validCityId
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBe('description es requiredo');
        expect(createNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: cityId requerido
    test('should return error if cityId is not provided', () => {
        // Datos de prueba con cityId faltante
        const neighborhoodData = {
            name: 'Palermo',
            description: 'Barrio turístico'
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBe('cityId es requiredo');
        expect(createNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: formato de cityId
    test('should return error if cityId has invalid format', () => {
        // Datos de prueba con cityId de formato inválido
        const neighborhoodData = {
            name: 'Palermo',
            description: 'Barrio turístico',
            cityId: 'invalid-id-format' // ID no válido
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBe('cityId debe ser un id valido para MongoDB');
        expect(createNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: isActive por defecto
    test('should set isActive to true by default if not provided', () => {
        // Datos de prueba sin isActive
        const neighborhoodData = {
            name: 'Palermo',
            description: 'Barrio turístico',
            cityId: validCityId
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createNeighborhoodDto).toBeInstanceOf(create_neighborhood_dto_1.CreateNeighborhoodDto);
        expect(createNeighborhoodDto === null || createNeighborhoodDto === void 0 ? void 0 : createNeighborhoodDto.isActive).toBe(true); // valor por defecto
    });
    // Prueba de validación: isActive debe ser booleano
    test('should return error if isActive is not a boolean', () => {
        // Datos de prueba con isActive no booleano
        const neighborhoodData = {
            name: 'Palermo',
            description: 'Barrio turístico',
            cityId: validCityId,
            isActive: 'yes' // no es booleano
        };
        // Creación del DTO
        const [error, createNeighborhoodDto] = create_neighborhood_dto_1.CreateNeighborhoodDto.create(neighborhoodData);
        // Verificaciones
        expect(error).toBe('isActive debe ser un valor boleano');
        expect(createNeighborhoodDto).toBeUndefined();
    });
});
