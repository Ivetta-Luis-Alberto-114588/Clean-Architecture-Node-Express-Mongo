"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/dtos/payment/update-payment-status.dto.test.ts
const update_payment_status_dto_1 = require("../../../../src/domain/dtos/payment/update-payment-status.dto");
const mercado_pago_interface_1 = require("../../../../src/domain/interfaces/payment/mercado-pago.interface");
const mongoose_1 = __importDefault(require("mongoose"));
describe('UpdatePaymentStatusDto', () => {
    // ID válido para pruebas
    const validPaymentId = new mongoose_1.default.Types.ObjectId().toString();
    const validProviderPaymentId = '123456789';
    // Datos válidos para las pruebas
    const validStatusUpdateData = {
        paymentId: validPaymentId,
        status: mercado_pago_interface_1.MercadoPagoPaymentStatus.APPROVED,
        providerPaymentId: validProviderPaymentId
    };
    // Prueba de creación exitosa
    test('should create a valid DTO with correct values', () => {
        // Creación del DTO
        const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(validStatusUpdateData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updatePaymentStatusDto).toBeInstanceOf(update_payment_status_dto_1.UpdatePaymentStatusDto);
        // Verificar valores
        expect(updatePaymentStatusDto === null || updatePaymentStatusDto === void 0 ? void 0 : updatePaymentStatusDto.paymentId).toBe(validPaymentId);
        expect(updatePaymentStatusDto === null || updatePaymentStatusDto === void 0 ? void 0 : updatePaymentStatusDto.status).toBe(mercado_pago_interface_1.MercadoPagoPaymentStatus.APPROVED);
        expect(updatePaymentStatusDto === null || updatePaymentStatusDto === void 0 ? void 0 : updatePaymentStatusDto.providerPaymentId).toBe(validProviderPaymentId);
        expect(updatePaymentStatusDto === null || updatePaymentStatusDto === void 0 ? void 0 : updatePaymentStatusDto.metadata).toBeUndefined();
    });
    // Prueba con metadata adicional
    test('should accept additional metadata', () => {
        // Datos con metadata
        const dataWithMetadata = Object.assign(Object.assign({}, validStatusUpdateData), { metadata: {
                transactionDetails: {
                    externalResourceUrl: 'http://example.com/receipt',
                    installmentAmount: 100
                },
                additionalInfo: 'Extra information'
            } });
        // Creación del DTO
        const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(dataWithMetadata);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(updatePaymentStatusDto === null || updatePaymentStatusDto === void 0 ? void 0 : updatePaymentStatusDto.metadata).toEqual(dataWithMetadata.metadata);
    });
    // Prueba de validación: paymentId requerido
    test('should return error if paymentId is not provided', () => {
        // Datos inválidos (sin paymentId)
        const invalidData = {
            status: mercado_pago_interface_1.MercadoPagoPaymentStatus.APPROVED,
            providerPaymentId: validProviderPaymentId
        };
        // Creación del DTO
        const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(invalidData);
        // Verificaciones
        expect(error).toBe('paymentId es requerido');
        expect(updatePaymentStatusDto).toBeUndefined();
    });
    // Prueba de validación: status requerido
    test('should return error if status is not provided', () => {
        // Datos inválidos (sin status)
        const invalidData = {
            paymentId: validPaymentId,
            providerPaymentId: validProviderPaymentId
        };
        // Creación del DTO
        const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(invalidData);
        // Verificaciones
        expect(error).toBe('status es requerido');
        expect(updatePaymentStatusDto).toBeUndefined();
    });
    // Prueba de validación: providerPaymentId requerido
    test('should return error if providerPaymentId is not provided', () => {
        // Datos inválidos (sin providerPaymentId)
        const invalidData = {
            paymentId: validPaymentId,
            status: mercado_pago_interface_1.MercadoPagoPaymentStatus.APPROVED
        };
        // Creación del DTO
        const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(invalidData);
        // Verificaciones
        expect(error).toBe('providerPaymentId es requerido');
        expect(updatePaymentStatusDto).toBeUndefined();
    });
    // Prueba de validación: estado válido
    test('should return error if status is not valid', () => {
        // Datos inválidos (status no válido)
        const invalidData = {
            paymentId: validPaymentId,
            status: 'invalid_status',
            providerPaymentId: validProviderPaymentId
        };
        // Creación del DTO
        const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(invalidData);
        // Verificaciones - comprobar que el error contiene información sobre los valores válidos
        expect(error).toContain('status debe ser uno de los siguientes valores');
        expect(error).toContain(Object.values(mercado_pago_interface_1.MercadoPagoPaymentStatus).join(', '));
        expect(updatePaymentStatusDto).toBeUndefined();
    });
    // Prueba para todos los estados de pago válidos
    test('should accept all valid payment statuses', () => {
        // Probar todos los estados de pago válidos
        const statuses = Object.values(mercado_pago_interface_1.MercadoPagoPaymentStatus);
        for (const status of statuses) {
            const statusUpdateData = Object.assign(Object.assign({}, validStatusUpdateData), { status });
            const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(statusUpdateData);
            expect(error).toBeUndefined();
            expect(updatePaymentStatusDto === null || updatePaymentStatusDto === void 0 ? void 0 : updatePaymentStatusDto.status).toBe(status);
        }
    });
    // Prueba para diferentes formatos de providerPaymentId
    test('should accept different providerPaymentId formats', () => {
        // Diferentes formatos de ID
        const providerIds = ['123456789', 'MP-1234-5678', 'payment_12345'];
        for (const id of providerIds) {
            const statusUpdateData = Object.assign(Object.assign({}, validStatusUpdateData), { providerPaymentId: id });
            const [error, updatePaymentStatusDto] = update_payment_status_dto_1.UpdatePaymentStatusDto.create(statusUpdateData);
            expect(error).toBeUndefined();
            expect(updatePaymentStatusDto === null || updatePaymentStatusDto === void 0 ? void 0 : updatePaymentStatusDto.providerPaymentId).toBe(id);
        }
    });
});
