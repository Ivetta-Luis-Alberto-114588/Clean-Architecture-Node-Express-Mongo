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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tests/utils/setup.ts
const mongoose_1 = __importDefault(require("mongoose"));
// Ampliar el tiempo de espera por defecto de las pruebas
jest.setTimeout(30000); // Aumentar a 30 segundos
// Conectar a MongoDB antes de las pruebas
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Setting up MongoDB connection for tests...");
    console.log("MongoDB URI:", process.env.MONGO_URL);
    console.log("MongoDB Name:", process.env.MONGO_DB_NAME);
    if (!process.env.MONGO_URL) {
        throw new Error('MongoDB URI not available');
    }
    yield mongoose_1.default.connect(process.env.MONGO_URL, {
        dbName: process.env.MONGO_DB_NAME
    });
    console.log("Connected to MongoDB. State:", mongoose_1.default.connection.readyState);
    console.log("Connection ID:", mongoose_1.default.connection.id);
}));
// Limpiar la base de datos después de cada prueba
afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Cleaning database after test...");
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        yield collection.deleteMany({});
    }
}));
// Desconectar de MongoDB después de todas las pruebas
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Disconnecting from MongoDB...");
    yield mongoose_1.default.connection.close();
}));
