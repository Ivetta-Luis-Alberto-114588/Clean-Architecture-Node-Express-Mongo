"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_neighborhood_dto_1 = require("../../../../src/domain/dtos/customers/update-neighborhood.dto");
const mongoose_1 = __importDefault(require("mongoose"));
describe('UpdateNeighborhoodDto', () => {
    // ID válido para pruebas
    const validCityId = new mongoose_1.default.Types.ObjectId().toString();
    // Prueba de actualización exitosa con todos los campos
    test('should create a valid DTO with all fields', () => {
        // Datos de prueba válidos
        const updateData = {
            name: 'Palermo Updated',
            description: 'Barrio renovado',
            cityId: validCityId,
            isActive: false
        };
        // Creación del DTO
        const [error, updateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateNeighborhoodDto).toBeInstanceOf(update_neighborhood_dto_1.UpdateNeighborhoodDto);
        // Verificar valores correctos y transformaciones
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.name).toBe('palermo updated'); // debe estar en minúsculas
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.description).toBe('barrio renovado'); // debe estar en minúsculas
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.cityId).toBe(validCityId);
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.isActive).toBe(false);
    });
    // Prueba de actualización exitosa con solo algunos campos
    test('should create a valid DTO with partial fields', () => {
        // Datos de prueba con solo algunos campos
        const updateData = {
            name: 'Palermo Updated',
            description: 'Barrio renovado'
        };
        // Creación del DTO
        const [error, updateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateNeighborhoodDto).toBeInstanceOf(update_neighborhood_dto_1.UpdateNeighborhoodDto);
        // Verificar valores correctos
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.name).toBe('palermo updated');
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.description).toBe('barrio renovado');
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.cityId).toBeUndefined(); // no se proporcionó
        expect(updateNeighborhoodDto === null || updateNeighborhoodDto === void 0 ? void 0 : updateNeighborhoodDto.isActive).toBeUndefined(); // no se proporcionó
    });
    // Prueba de validación: objeto vacío
    test('should return error if no update fields are provided', () => {
        // Datos de prueba vacíos
        const updateData = {};
        // Creación del DTO
        const [error, updateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateData);
        // Verificaciones
        expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
        expect(updateNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: longitud mínima del nombre
    test('should return error if name is too short', () => {
        // Datos de prueba con nombre demasiado corto
        const updateData = {
            name: 'Pa' // menos de 3 caracteres
        };
        // Creación del DTO
        const [error, updateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateData);
        // Verificaciones
        expect(error).toBe('name debe tener al menos 3 caracteres');
        expect(updateNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: formato de cityId
    test('should return error if cityId has invalid format', () => {
        // Datos de prueba con cityId de formato inválido
        const updateData = {
            cityId: 'invalid-id-format' // ID no válido
        };
        // Creación del DTO
        const [error, updateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateData);
        // Verificaciones
        expect(error).toBe('cityId debe ser un id de MongoDB válido');
        expect(updateNeighborhoodDto).toBeUndefined();
    });
    // Prueba de validación: isActive debe ser booleano
    test('should return error if isActive is not a boolean', () => {
        // Datos de prueba con isActive no booleano
        const updateData = {
            isActive: 'false' // string en lugar de boolean
        };
        // Creación del DTO
        const [error, updateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateData);
        // Verificaciones
        expect(error).toBe('isActive debe ser un valor boleano');
        expect(updateNeighborhoodDto).toBeUndefined();
    });
    // Prueba de múltiples campos con uno inválido
    test('should validate all fields even when multiple are provided', () => {
        // Datos de prueba con un campo inválido
        const updateData = {
            name: 'Palermo',
            cityId: 'invalid-id', // ID inválido
            isActive: false
        };
        // Creación del DTO
        const [error, updateNeighborhoodDto] = update_neighborhood_dto_1.UpdateNeighborhoodDto.update(updateData);
        // Verificaciones
        expect(error).toBe('cityId debe ser un id de MongoDB válido');
        expect(updateNeighborhoodDto).toBeUndefined();
    });
});
