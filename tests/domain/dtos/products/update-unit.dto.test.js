"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/dtos/products/update-unit.dto.test.ts
const udpate_unit_dto_1 = require("../../../../src/domain/dtos/products/udpate-unit.dto");
describe('UpdateUnitDto', () => {
    // Prueba de actualización exitosa con todos los campos
    test('should create a valid DTO with all fields', () => {
        // Datos de prueba válidos
        const updateData = {
            name: 'Updated Unit',
            description: 'Updated unit description',
            isActive: false
        };
        // Creación del DTO
        const [error, updateUnitDto] = udpate_unit_dto_1.UpdateUnitDto.update(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateUnitDto).toBeInstanceOf(udpate_unit_dto_1.UpdateUnitDto);
        // Verificar valores correctos
        expect(updateUnitDto === null || updateUnitDto === void 0 ? void 0 : updateUnitDto.name).toBe('updated unit');
        expect(updateUnitDto === null || updateUnitDto === void 0 ? void 0 : updateUnitDto.description).toBe('updated unit description');
        expect(updateUnitDto === null || updateUnitDto === void 0 ? void 0 : updateUnitDto.isActive).toBe(false);
    });
    // Prueba de actualización exitosa con solo algunos campos
    test('should create a valid DTO with partial fields', () => {
        // Datos de prueba con solo nombre
        const updateData = {
            name: 'Updated Unit Name'
        };
        // Creación del DTO
        const [error, updateUnitDto] = udpate_unit_dto_1.UpdateUnitDto.update(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateUnitDto).toBeInstanceOf(udpate_unit_dto_1.UpdateUnitDto);
        // Verificar valores correctos
        expect(updateUnitDto === null || updateUnitDto === void 0 ? void 0 : updateUnitDto.name).toBe('updated unit name');
        expect(updateUnitDto === null || updateUnitDto === void 0 ? void 0 : updateUnitDto.description).toBeUndefined();
        expect(updateUnitDto === null || updateUnitDto === void 0 ? void 0 : updateUnitDto.isActive).toBeUndefined();
    });
    // Prueba de validación: objeto vacío
    test('should return error if no update fields are provided', () => {
        // Datos de prueba vacíos
        const updateData = {};
        // Creación del DTO
        const [error, updateUnitDto] = udpate_unit_dto_1.UpdateUnitDto.update(updateData);
        // Verificaciones
        expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
        expect(updateUnitDto).toBeUndefined();
    });
    // Prueba de validación: nombre muy corto
    test('should return error if name is too short', () => {
        // Datos de prueba con nombre demasiado corto
        const updateData = {
            name: 'U' // supongamos que requiere al menos 2 caracteres
        };
        // Creación del DTO
        const [error, updateUnitDto] = udpate_unit_dto_1.UpdateUnitDto.update(updateData);
        // Verificaciones
        expect(error).toBe('El nombre debe tener al menos 2 caracteres');
        expect(updateUnitDto).toBeUndefined();
    });
    // Prueba de validación: isActive debe ser booleano
    test('should return error if isActive is not a boolean', () => {
        // Datos de prueba con isActive no booleano
        const updateData = {
            isActive: 'true' // string en lugar de boolean
        };
        // Creación del DTO
        const [error, updateUnitDto] = udpate_unit_dto_1.UpdateUnitDto.update(updateData);
        // Verificaciones
        expect(error).toBe('isActive debe ser un valor booleano');
        expect(updateUnitDto).toBeUndefined();
    });
    // Prueba con diferentes combinaciones de campos
    test('should accept different field combinations', () => {
        // Prueba con solo descripción
        const [error1, updateUnitDto1] = udpate_unit_dto_1.UpdateUnitDto.update({
            description: 'Only description update'
        });
        expect(error1).toBeUndefined();
        expect(updateUnitDto1 === null || updateUnitDto1 === void 0 ? void 0 : updateUnitDto1.description).toBe('only description update');
        expect(updateUnitDto1 === null || updateUnitDto1 === void 0 ? void 0 : updateUnitDto1.name).toBeUndefined();
        expect(updateUnitDto1 === null || updateUnitDto1 === void 0 ? void 0 : updateUnitDto1.isActive).toBeUndefined();
        // Prueba con solo isActive
        const [error2, updateUnitDto2] = udpate_unit_dto_1.UpdateUnitDto.update({
            isActive: true
        });
        expect(error2).toBeUndefined();
        expect(updateUnitDto2 === null || updateUnitDto2 === void 0 ? void 0 : updateUnitDto2.isActive).toBe(true);
        expect(updateUnitDto2 === null || updateUnitDto2 === void 0 ? void 0 : updateUnitDto2.name).toBeUndefined();
        expect(updateUnitDto2 === null || updateUnitDto2 === void 0 ? void 0 : updateUnitDto2.description).toBeUndefined();
        // Prueba con nombre y isActive
        const [error3, updateUnitDto3] = udpate_unit_dto_1.UpdateUnitDto.update({
            name: 'New Name',
            isActive: false
        });
        expect(error3).toBeUndefined();
        expect(updateUnitDto3 === null || updateUnitDto3 === void 0 ? void 0 : updateUnitDto3.name).toBe('new name');
        expect(updateUnitDto3 === null || updateUnitDto3 === void 0 ? void 0 : updateUnitDto3.isActive).toBe(false);
        expect(updateUnitDto3 === null || updateUnitDto3 === void 0 ? void 0 : updateUnitDto3.description).toBeUndefined();
    });
    // Prueba de múltiples campos con uno inválido
    test('should validate all fields even when multiple are provided', () => {
        // Datos de prueba con un campo inválido
        const updateData = {
            name: 'Valid Name',
            description: 'Valid description',
            isActive: 'invalid' // no es booleano
        };
        // Creación del DTO
        const [error, updateUnitDto] = udpate_unit_dto_1.UpdateUnitDto.update(updateData);
        // Verificaciones
        expect(error).toBe('isActive debe ser un valor booleano');
        expect(updateUnitDto).toBeUndefined();
    });
});
