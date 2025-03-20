"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/domain/dtos/payment/create-payment.dto.test.ts
const create_payment_dto_1 = require("../../../../src/domain/dtos/payment/create-payment.dto");
const payment_entity_1 = require("../../../../src/domain/entities/payment/payment.entity");
const mongoose_1 = __importDefault(require("mongoose"));
describe('CreatePaymentDto', () => {
    // ID válido para pruebas
    const validSaleId = new mongoose_1.default.Types.ObjectId().toString();
    const validCustomerId = new mongoose_1.default.Types.ObjectId().toString();
    // Datos válidos para las pruebas
    const validItems = [
        {
            id: '1',
            title: 'Test Item',
            description: 'Test Description',
            quantity: 1,
            unit_price: 100
        }
    ];
    const validPayer = {
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        phone: {
            area_code: '123',
            number: '4567890'
        },
        identification: {
            type: 'DNI',
            number: '12345678'
        }
    };
    const validBackUrls = {
        success: 'http://example.com/success',
        failure: 'http://example.com/failure',
        pending: 'http://example.com/pending'
    };
    const validNotificationUrl = 'http://example.com/notification';
    // Datos completos de pago válidos
    const validPaymentData = {
        saleId: validSaleId,
        customerId: validCustomerId,
        amount: 100,
        provider: payment_entity_1.PaymentProvider.MERCADO_PAGO,
        items: validItems,
        payer: validPayer,
        backUrls: validBackUrls,
        notificationUrl: validNotificationUrl
    };
    // Prueba de creación exitosa
    test('should create a valid DTO with correct values', () => {
        // Creación del DTO
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(validPaymentData);
        // Verificaciones
        expect(error).toBeUndefined();
        expect(createPaymentDto).toBeInstanceOf(create_payment_dto_1.CreatePaymentDto);
        // Verificar valores
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.saleId).toBe(validSaleId);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.customerId).toBe(validCustomerId);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.amount).toBe(100);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.provider).toBe(payment_entity_1.PaymentProvider.MERCADO_PAGO);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.items).toEqual(validItems);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.payer).toEqual(validPayer);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.backUrls).toEqual(validBackUrls);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.notificationUrl).toBe(validNotificationUrl);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.externalReference).toBe(`sale-${validSaleId}`);
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.idempotencyKey).toBeDefined();
    });
    // Prueba de validación: saleId requerido
    test('should return error if saleId is not provided', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { saleId: undefined });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('saleId es requerido');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: customerId requerido
    test('should return error if customerId is not provided', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { customerId: undefined });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('customerId es requerido');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: amount debe ser positivo
    test('should return error if amount is not positive', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { amount: 0 });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('amount debe ser mayor a 0');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: items es requerido
    test('should return error if items is not provided', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { items: undefined });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('items debe ser un array no vacío');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: items vacío
    test('should return error if items is empty array', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { items: [] });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('items debe ser un array no vacío');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: payer es requerido
    test('should return error if payer is not provided', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { payer: undefined });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('payer es requerido');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: email del payer es requerido
    test('should return error if payer email is not provided', () => {
        const invalidPayer = Object.assign(Object.assign({}, validPayer), { email: undefined });
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { payer: invalidPayer });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('email del pagador es requerido');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: backUrls es requerido
    test('should return error if backUrls is not provided', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { backUrls: undefined });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('backUrls es requerido');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: backUrl success es requerido
    test('should return error if backUrl success is not provided', () => {
        const invalidBackUrls = Object.assign(Object.assign({}, validBackUrls), { success: undefined });
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { backUrls: invalidBackUrls });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('backUrl de éxito es requerida');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: backUrl failure es requerido
    test('should return error if backUrl failure is not provided', () => {
        const invalidBackUrls = Object.assign(Object.assign({}, validBackUrls), { failure: undefined });
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { backUrls: invalidBackUrls });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('backUrl de fallo es requerida');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: backUrl pending es requerido
    test('should return error if backUrl pending is not provided', () => {
        const invalidBackUrls = Object.assign(Object.assign({}, validBackUrls), { pending: undefined });
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { backUrls: invalidBackUrls });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('backUrl de pendiente es requerida');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: notificationUrl es requerido
    test('should return error if notificationUrl is not provided', () => {
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { notificationUrl: undefined });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('notificationUrl es requerida');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: id del item es requerido
    test('should return error if item id is not provided', () => {
        const invalidItems = [Object.assign(Object.assign({}, validItems[0]), { id: undefined })];
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { items: invalidItems });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('id del item es requerido');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: title del item es requerido
    test('should return error if item title is not provided', () => {
        const invalidItems = [Object.assign(Object.assign({}, validItems[0]), { title: undefined })];
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { items: invalidItems });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('title del item es requerido');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: quantity del item debe ser positivo
    test('should return error if item quantity is not positive', () => {
        const invalidItems = [Object.assign(Object.assign({}, validItems[0]), { quantity: 0 })];
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { items: invalidItems });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('quantity del item debe ser mayor a 0');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba de validación: unit_price del item debe ser positivo
    test('should return error if item unit_price is not positive', () => {
        const invalidItems = [Object.assign(Object.assign({}, validItems[0]), { unit_price: 0 })];
        const invalidData = Object.assign(Object.assign({}, validPaymentData), { items: invalidItems });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(invalidData);
        expect(error).toBe('unit_price del item debe ser mayor a 0');
        expect(createPaymentDto).toBeUndefined();
    });
    // Prueba para verificar que se genera un idempotencyKey por defecto
    test('should generate idempotencyKey if not provided', () => {
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(validPaymentData);
        expect(error).toBeUndefined();
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.idempotencyKey).toBeDefined();
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.idempotencyKey).toContain('payment-' + validSaleId);
    });
    // Prueba para verificar que se respeta el idempotencyKey si se proporciona
    test('should use provided idempotencyKey', () => {
        const customIdempotencyKey = 'custom-key-123';
        const dataWithIdempotencyKey = Object.assign(Object.assign({}, validPaymentData), { idempotencyKey: customIdempotencyKey });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(dataWithIdempotencyKey);
        expect(error).toBeUndefined();
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.idempotencyKey).toBe(customIdempotencyKey);
    });
    // Prueba para verificar que se genera un externalReference por defecto
    test('should generate externalReference if not provided', () => {
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(validPaymentData);
        expect(error).toBeUndefined();
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.externalReference).toBe(`sale-${validSaleId}`);
    });
    // Prueba para verificar que se respeta el externalReference si se proporciona
    test('should use provided externalReference', () => {
        const customExternalReference = 'custom-ref-123';
        const dataWithExternalReference = Object.assign(Object.assign({}, validPaymentData), { externalReference: customExternalReference });
        const [error, createPaymentDto] = create_payment_dto_1.CreatePaymentDto.create(dataWithExternalReference);
        expect(error).toBeUndefined();
        expect(createPaymentDto === null || createPaymentDto === void 0 ? void 0 : createPaymentDto.externalReference).toBe(customExternalReference);
    });
});
