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
exports.default = globalSetup;
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoServer;
function globalSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        // Iniciar el servidor MongoDB en memoria
        mongoServer = yield mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        // Guardar la URI para usarla en las pruebas
        process.env.MONGO_URL = mongoUri;
        process.env.MONGO_DB_NAME = 'test-db';
        // Otras variables de entorno para tests
        process.env.PORT = '3001';
        process.env.JWT_SEED = 'test-jwt-seed';
        process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TEST-xxxx-TEST';
        process.env.MERCADO_PAGO_PUBLIC_KEY = 'TEST-xxxx-TEST';
        process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
        process.env.OPENAI_API_KEY = 'test-openai-key';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        process.env.URL_RESPONSE_WEBHOOK_NGROK = 'http://localhost:3001/';
        process.env.NODE_ENV = 'test';
        // Guardar la instancia de MongoMemoryServer para poder cerrarla después
        global.__MONGO_SERVER__ = mongoServer;
    });
}
