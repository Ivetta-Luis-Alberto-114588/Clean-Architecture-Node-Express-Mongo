"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestUser = exports.generateTestToken = exports.mockResponse = exports.mockRequest = void 0;
const user_entity_1 = require("../../src/domain/entities/user.entity");
const jwt_1 = require("../../src/configs/jwt");
// Crear un mock de Request de Express
const mockRequest = (data = {}) => {
    return Object.assign({ body: data.body || {}, params: data.params || {}, query: data.query || {}, headers: data.headers || {} }, data);
};
exports.mockRequest = mockRequest;
// Crear un mock de Response de Express
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
};
exports.mockResponse = mockResponse;
// Generar un token JWT para pruebas
const generateTestToken = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield jwt_1.JwtAdapter.generateToken({ id: user.id });
    if (!token)
        throw new Error('Failed to generate test token');
    return token;
});
exports.generateTestToken = generateTestToken;
// Crear un usuario de prueba
const createTestUser = () => {
    return new user_entity_1.UserEntity('test-id', 'Test User', 'test@example.com', 'hashedpassword', ['USER_ROLE'], 'https://example.com/avatar.jpg');
};
exports.createTestUser = createTestUser;
