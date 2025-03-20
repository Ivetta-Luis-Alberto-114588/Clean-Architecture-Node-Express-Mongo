"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/dtos/payment/process-webhook.dto.test.ts
const process_webhook_dto_1 = require("../../../../src/domain/dtos/payment/process-webhook.dto");
describe('ProcessWebhookDto', () => {
    // Datos válidos para las pruebas
    const validWebhookData = {
        type: 'payment',
        action: 'payment.created',
        data: {
            id: '123456789'
        }
    };
    // Prueba de creación exitosa
    test('should create a valid DTO with correct values', () => {
        // Creación del DTO
        const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(validWebhookData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(processWebhookDto).toBeInstanceOf(process_webhook_dto_1.ProcessWebhookDto);
        // Verificar valores
        expect(processWebhookDto === null || processWebhookDto === void 0 ? void 0 : processWebhookDto.type).toBe('payment');
        expect(processWebhookDto === null || processWebhookDto === void 0 ? void 0 : processWebhookDto.action).toBe('payment.created');
        expect(processWebhookDto === null || processWebhookDto === void 0 ? void 0 : processWebhookDto.data).toEqual({ id: '123456789' });
    });
    // Prueba de validación: type requerido
    test('should return error if type is not provided', () => {
        // Datos inválidos (sin type)
        const invalidData = {
            action: 'payment.created',
            data: {
                id: '123456789'
            }
        };
        // Creación del DTO
        const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(invalidData);
        // Verificaciones
        expect(error).toBe('type es requerido');
        expect(processWebhookDto).toBeUndefined();
    });
    // Prueba de validación: action requerido
    test('should return error if action is not provided', () => {
        // Datos inválidos (sin action)
        const invalidData = {
            type: 'payment',
            data: {
                id: '123456789'
            }
        };
        // Creación del DTO
        const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(invalidData);
        // Verificaciones
        expect(error).toBe('action es requerido');
        expect(processWebhookDto).toBeUndefined();
    });
    // Prueba de validación: data requerido
    test('should return error if data is not provided', () => {
        // Datos inválidos (sin data)
        const invalidData = {
            type: 'payment',
            action: 'payment.created'
        };
        // Creación del DTO
        const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(invalidData);
        // Verificaciones
        expect(error).toBe('data es requerido');
        expect(processWebhookDto).toBeUndefined();
    });
    // Prueba de validación: data.id requerido
    test('should return error if data.id is not provided', () => {
        // Datos inválidos (sin data.id)
        const invalidData = {
            type: 'payment',
            action: 'payment.created',
            data: {}
        };
        // Creación del DTO
        const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(invalidData);
        // Verificaciones
        expect(error).toBe('data.id es requerido');
        expect(processWebhookDto).toBeUndefined();
    });
    // Prueba con diferentes tipos de eventos
    test('should accept different event types', () => {
        // Diferentes tipos de eventos
        const eventTypes = ['payment', 'plan', 'subscription', 'invoice'];
        for (const type of eventTypes) {
            const webhookData = Object.assign(Object.assign({}, validWebhookData), { type });
            const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(webhookData);
            expect(error).toBeUndefined();
            expect(processWebhookDto === null || processWebhookDto === void 0 ? void 0 : processWebhookDto.type).toBe(type);
        }
    });
    // Prueba con diferentes acciones
    test('should accept different actions', () => {
        // Diferentes acciones
        const actions = ['payment.created', 'payment.updated', 'payment.approved', 'payment.rejected'];
        for (const action of actions) {
            const webhookData = Object.assign(Object.assign({}, validWebhookData), { action });
            const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(webhookData);
            expect(error).toBeUndefined();
            expect(processWebhookDto === null || processWebhookDto === void 0 ? void 0 : processWebhookDto.action).toBe(action);
        }
    });
    // Prueba con diferentes formatos de ID
    test('should accept different id formats', () => {
        // Diferentes formatos de ID
        const ids = ['123456789', 'abc-123', 'payment_12345'];
        for (const id of ids) {
            const webhookData = Object.assign(Object.assign({}, validWebhookData), { data: { id } });
            const [error, processWebhookDto] = process_webhook_dto_1.ProcessWebhookDto.create(webhookData);
            expect(error).toBeUndefined();
            expect(processWebhookDto === null || processWebhookDto === void 0 ? void 0 : processWebhookDto.data.id).toBe(id);
        }
    });
});
