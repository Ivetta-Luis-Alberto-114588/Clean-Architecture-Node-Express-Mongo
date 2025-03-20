"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_customer_dto_1 = require("../../../../src/domain/dtos/customers/update-customer.dto");
const mongoose_1 = __importDefault(require("mongoose"));
describe('UpdateCustomerDto', () => {
    // ID válido para pruebas
    const validNeighborhoodId = new mongoose_1.default.Types.ObjectId().toString();
    // Prueba de actualización exitosa con todos los campos
    test('should create a valid DTO with all fields', () => {
        // Datos de prueba válidos con todos los campos
        const updateData = {
            name: 'Juan Pérez Updated',
            email: 'juan.perez.updated@example.com',
            phone: '+5491198765432',
            address: 'Av. Rivadavia 5678',
            neighborhoodId: validNeighborhoodId,
            isActive: false
        };
        // Creación del DTO
        const [error, updateCustomerDto] = update_customer_dto_1.UpdateCustomerDto.update(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateCustomerDto).toBeInstanceOf(update_customer_dto_1.UpdateCustomerDto);
        // Verificar campos proporcionados
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.name).toBe('juan pérez updated');
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.email).toBe('juan.perez.updated@example.com');
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.phone).toBe('+5491198765432');
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.address).toBe('av. rivadavia 5678');
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.neighborhoodId).toBe(validNeighborhoodId);
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.isActive).toBe(false);
    });
    // Prueba de validación: objeto vacío
    test('should return error if no update fields are provided', () => {
        // Datos de prueba vacíos
        const updateData = {};
        // Creación del DTO
        const [error, updateCustomerDto] = update_customer_dto_1.UpdateCustomerDto.update(updateData);
        // Verificaciones
        expect(error).toBe('Debe proporcionar al menos un campo para actualizar');
        expect(updateCustomerDto).toBeUndefined();
    });
    // Prueba de validación: nombre demasiado corto
    test('should return error if name is too short', () => {
        // Datos de prueba con nombre demasiado corto
        const updateData = {
            name: 'J' // menos de 2 caracteres
        };
        // Creación del DTO
        const [error, updateCustomerDto] = update_customer_dto_1.UpdateCustomerDto.update(updateData);
        // Verificaciones
        expect(error).toBe('El nombre debe tener al menos 2 caracteres');
        expect(updateCustomerDto).toBeUndefined();
    });
    // Prueba de validación: formato de email
    test('should return error if email format is invalid', () => {
        // Datos de prueba con email de formato inválido
        const updateData = {
            email: 'invalid-email' // formato inválido
        };
        // Creación del DTO
        const [error, updateCustomerDto] = update_customer_dto_1.UpdateCustomerDto.update(updateData);
        // Verificaciones
        expect(error).toBe('El formato del email no es válido');
        expect(updateCustomerDto).toBeUndefined();
    });
    // Prueba de actualización exitosa con solo algunos campos
    test('should create a valid DTO with name only', () => {
        // Datos de prueba con solo nombre
        const updateData = {
            name: 'Juan Pérez Updated'
        };
        // Creación del DTO
        const [error, updateCustomerDto] = update_customer_dto_1.UpdateCustomerDto.update(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateCustomerDto).toBeInstanceOf(update_customer_dto_1.UpdateCustomerDto);
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.name).toBe('juan pérez updated');
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.email).toBeUndefined();
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.phone).toBeUndefined();
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.address).toBeUndefined();
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.neighborhoodId).toBeUndefined();
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.isActive).toBeUndefined();
    });
    test('should create a valid DTO with email only', () => {
        // Datos de prueba con solo email
        const updateData = {
            email: 'juan.nuevo@example.com'
        };
        // Creación del DTO
        const [error, updateCustomerDto] = update_customer_dto_1.UpdateCustomerDto.update(updateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updateCustomerDto).toBeInstanceOf(update_customer_dto_1.UpdateCustomerDto);
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.name).toBeUndefined();
        expect(updateCustomerDto === null || updateCustomerDto === void 0 ? void 0 : updateCustomerDto.email).toBe('juan.nuevo@example.com');
    });
});
