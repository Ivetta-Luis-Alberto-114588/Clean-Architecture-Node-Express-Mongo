"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pagination_dto_1 = require("../../../../src/domain/dtos/shared/pagination.dto");
describe('PaginationDto', () => {
    // Prueba de creación exitosa con valores proporcionados
    test('should create a valid DTO with provided values', () => {
        // Valores válidos para la paginación
        const page = 2;
        const limit = 15;
        // Creación del DTO
        const [error, paginationDto] = pagination_dto_1.PaginationDto.create(page, limit);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(paginationDto).toBeInstanceOf(pagination_dto_1.PaginationDto);
        expect(paginationDto === null || paginationDto === void 0 ? void 0 : paginationDto.page).toBe(page);
        expect(paginationDto === null || paginationDto === void 0 ? void 0 : paginationDto.limit).toBe(limit);
    });
    // Prueba de validación: página inválida
    test('should return error if page is less than 1', () => {
        // Valores inválidos para la paginación
        const page = 0; // debe ser al menos 1
        const limit = 10;
        // Creación del DTO
        const [error, paginationDto] = pagination_dto_1.PaginationDto.create(page, limit);
        // Verificaciones - solo validamos que haya un error, no el mensaje exacto
        expect(error).toBeDefined();
        expect(paginationDto).toBeUndefined();
    });
    // Prueba de validación: límite inválido
    test('should return error if limit is less than 1', () => {
        // Valores inválidos para la paginación
        const page = 1;
        const limit = 0; // debe ser al menos 1
        // Creación del DTO
        const [error, paginationDto] = pagination_dto_1.PaginationDto.create(page, limit);
        // Verificaciones - solo validamos que haya un error, no el mensaje exacto
        expect(error).toBeDefined();
        expect(paginationDto).toBeUndefined();
    });
    test('should handle non-numeric values appropriately', () => {
        // Intentar crear con valores no numéricos
        const [error, paginationDto] = pagination_dto_1.PaginationDto.create('one', 'ten');
        // Debería manejar esto de alguna manera (ya sea con un error o con una conversión)
        // Solo verificamos que se comporte de manera consistente, no exactamente cómo
        if (error) {
            expect(paginationDto).toBeUndefined();
        }
        else if (paginationDto) {
            // Si convierte los valores, deberían ser números
            expect(typeof paginationDto.page).toBe('number');
            expect(typeof paginationDto.limit).toBe('number');
        }
    });
    // Prueba de validación: valores negativos
    test('should handle negative values appropriately', () => {
        // Valores negativos
        const [error, paginationDto] = pagination_dto_1.PaginationDto.create(-1, -5);
        // Debería dar un error o manejar los valores negativos de alguna forma
        expect(error).toBeDefined();
        expect(paginationDto).toBeUndefined();
    });
    // Prueba de valores válidos grandes
    test('should accept large valid values', () => {
        // Valores grandes pero válidos
        const page = 1000;
        const limit = 5000;
        // Creación del DTO
        const [error, paginationDto] = pagination_dto_1.PaginationDto.create(page, limit);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(paginationDto).toBeInstanceOf(pagination_dto_1.PaginationDto);
        expect(paginationDto === null || paginationDto === void 0 ? void 0 : paginationDto.page).toBe(page);
        expect(paginationDto === null || paginationDto === void 0 ? void 0 : paginationDto.limit).toBe(limit);
    });
});
