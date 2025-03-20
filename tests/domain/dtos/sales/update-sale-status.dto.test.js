"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/dtos/sales/update-sale-status.dto.test.ts
const update_sale_status_dto_1 = require("../../../../src/domain/dtos/sales/update-sale-status.dto");
describe('UpdateSaleStatusDto', () => {
    // Datos válidos para las pruebas
    const validStatusData = {
        status: 'completed',
        notes: 'Entrega realizada con éxito'
    };
    // Prueba de actualización exitosa con todos los campos
    test('should create a valid DTO with all fields', () => {
        // Creación del DTO
        const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(validStatusData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateSaleStatusDto).toBeInstanceOf(update_sale_status_dto_1.UpdateSaleStatusDto);
        // Verificar valores
        expect(updateSaleStatusDto === null || updateSaleStatusDto === void 0 ? void 0 : updateSaleStatusDto.status).toBe('completed');
        expect(updateSaleStatusDto === null || updateSaleStatusDto === void 0 ? void 0 : updateSaleStatusDto.notes).toBe('Entrega realizada con éxito');
    });
    // Prueba de actualización exitosa sin notas
    test('should create a valid DTO without notes', () => {
        // Datos sin notas
        const dataWithoutNotes = {
            status: 'completed'
        };
        // Creación del DTO
        const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(dataWithoutNotes);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateSaleStatusDto).toBeInstanceOf(update_sale_status_dto_1.UpdateSaleStatusDto);
        expect(updateSaleStatusDto === null || updateSaleStatusDto === void 0 ? void 0 : updateSaleStatusDto.status).toBe('completed');
        expect(updateSaleStatusDto === null || updateSaleStatusDto === void 0 ? void 0 : updateSaleStatusDto.notes).toBeUndefined();
    });
    // Prueba de validación: status requerido
    test('should return error if status is not provided', () => {
        // Datos inválidos (sin status)
        const invalidData = {
            notes: 'Entrega realizada con éxito'
        };
        // Creación del DTO
        const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(invalidData);
        // Verificaciones
        expect(error).toBe('status es requerido');
        expect(updateSaleStatusDto).toBeUndefined();
    });
    // Prueba de validación: status debe ser uno de los valores permitidos
    test('should return error if status is not one of the allowed values', () => {
        // Datos inválidos (status no válido)
        const invalidData = {
            status: 'invalid_status', // No es uno de los valores permitidos
            notes: 'Entrega realizada con éxito'
        };
        // Creación del DTO
        const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(invalidData);
        // Verificaciones
        expect(error).toBe("status debe ser 'pending', 'completed' o 'cancelled'");
        expect(updateSaleStatusDto).toBeUndefined();
    });
    // Prueba para cada uno de los valores de status permitidos
    test('should accept all allowed status values', () => {
        // Array con todos los valores permitidos
        const allowedStatuses = ['pending', 'completed', 'cancelled'];
        // Probar cada valor permitido
        allowedStatuses.forEach(status => {
            const data = { status };
            const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(data);
            // Verificaciones
            expect(error).toBeUndefined();
            expect(updateSaleStatusDto).toBeInstanceOf(update_sale_status_dto_1.UpdateSaleStatusDto);
            expect(updateSaleStatusDto === null || updateSaleStatusDto === void 0 ? void 0 : updateSaleStatusDto.status).toBe(status);
        });
    });
    // Prueba con notas muy largas (debería aceptarlas)
    test('should accept long notes', () => {
        var _a;
        // Datos con notas largas
        const dataWithLongNotes = {
            status: 'cancelled',
            notes: 'a'.repeat(1000) // 1000 caracteres
        };
        // Creación del DTO
        const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(dataWithLongNotes);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateSaleStatusDto).toBeInstanceOf(update_sale_status_dto_1.UpdateSaleStatusDto);
        expect((_a = updateSaleStatusDto === null || updateSaleStatusDto === void 0 ? void 0 : updateSaleStatusDto.notes) === null || _a === void 0 ? void 0 : _a.length).toBe(1000);
    });
    // Prueba con valores de status en diferentes casos (mayúsculas/minúsculas)
    // Nota: Esto depende de si tu implementación normaliza el status o no
    test('should handle case-sensitive status values (if not normalized)', () => {
        // Datos con status en diferentes casos
        const upperCaseData = {
            status: 'COMPLETED',
            notes: 'Test'
        };
        // Creación del DTO - esto asume que tu implementación NO normaliza el status
        // Si tu implementación normaliza el status, deberías ajustar esta prueba
        const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(upperCaseData);
        // Verificaciones - esto asume que tu implementación no acepta valores en mayúsculas
        // Si tu implementación normaliza el status, las siguientes expectativas deberían cambiar
        expect(error).toBe("status debe ser 'pending', 'completed' o 'cancelled'");
        expect(updateSaleStatusDto).toBeUndefined();
    });
    // Prueba con tipo de datos incorrecto para status
    test('should return error if status is not a string', () => {
        // Datos con status no string
        const invalidTypeData = {
            status: 123, // número en lugar de string
            notes: 'Test'
        };
        // Creación del DTO
        const [error, updateSaleStatusDto] = update_sale_status_dto_1.UpdateSaleStatusDto.update(invalidTypeData);
        // Verificaciones
        expect(error).toBeDefined();
        expect(updateSaleStatusDto).toBeUndefined();
    });
});
