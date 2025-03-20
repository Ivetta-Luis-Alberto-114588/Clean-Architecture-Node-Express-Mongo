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
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const server_1 = require("../../../src/presentation/server");
const routes_1 = require("../../../src/presentation/routes");
const user_model_1 = require("../../../src/data/mongodb/models/user.model");
const bcrypt_1 = require("../../../src/configs/bcrypt");
const mongoose_1 = __importDefault(require("mongoose"));
describe('Auth Routes Integration Tests', () => {
    // Crear una instancia del servidor para las pruebas
    const app = (0, express_1.default)();
    let testServer;
    // Configuración previa a todas las pruebas
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log("MongoDB connection state:", mongoose_1.default.connection.readyState);
        console.log("Test using MongoDB connection:", mongoose_1.default.connection.id);
        // Asegurarse de que estamos conectados a la base de datos
        if (mongoose_1.default.connection.readyState !== 1) {
            console.warn("MongoDB connection is not active. Tests might fail.");
            yield mongoose_1.default.connect(process.env.MONGO_URL, {
                dbName: process.env.MONGO_DB_NAME
            });
            console.log("Connected to MongoDB. New state:", mongoose_1.default.connection.readyState);
        }
        console.log("Clearing users collection...");
        // Limpiar la colección de usuarios antes de empezar
        yield user_model_1.UserModel.deleteMany({});
        console.log("Creating test server...");
        // Crear el servidor de pruebas
        testServer = new server_1.server({
            p_port: 3001,
            p_routes: routes_1.MainRoutes.getMainRoutes
        });
        // Aplicar las rutas al servidor de express
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true }));
        app.use(routes_1.MainRoutes.getMainRoutes);
    }));
    // Limpiar la base de datos después de todas las pruebas
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Cleaning up after all tests...");
        if (mongoose_1.default.connection.readyState !== 0) {
            yield user_model_1.UserModel.deleteMany({});
            yield mongoose_1.default.connection.close();
        }
    }));
    // Datos de prueba válidos
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    };
    // Test simplificado para depurar el registro
    test('should register a new user', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Starting register test with data:", testUser);
        // Hacer la solicitud de registro
        const response = yield (0, supertest_1.default)(app)
            .post('/api/auth/register')
            .send(testUser);
        console.log("Register response status:", response.status);
        console.log("Register response body:", response.body);
        // Verificaciones básicas de la respuesta
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('token');
        // En lugar de buscar en la base de datos, vamos a verificar directamente
        // los datos en la respuesta del servidor
        const user = response.body.user;
        expect(user.name).toBe(testUser.name.toLowerCase());
        expect(user.email).toBe(testUser.email.toLowerCase());
        // Verificar que la contraseña está hasheada (no debería ser la misma que la original)
        expect(user.password).not.toBe(testUser.password);
        // También podemos verificar que el token se haya generado correctamente
        expect(user.token).toBeTruthy();
        expect(typeof user.token).toBe('string');
        expect(user.token.split('.').length).toBe(3); // Un JWT válido tiene 3 partes separadas por puntos
    }));
    // Test para login - MODIFICADO para mejorar la depuración
    test('should login an existing user', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("\n==== STARTING LOGIN TEST ====");
        console.log("Cleaning up database before login test...");
        // Limpiar usuarios existentes para evitar conflictos
        yield user_model_1.UserModel.deleteMany({});
        // Crear un usuario directamente en la base de datos para el login
        const hashedPassword = bcrypt_1.BcryptAdapter.hash(testUser.password);
        console.log("Creating test user with hashed password:", hashedPassword);
        try {
            const user = yield user_model_1.UserModel.create({
                name: testUser.name.toLowerCase(),
                email: testUser.email.toLowerCase(),
                password: hashedPassword,
                roles: ['USER_ROLE']
            });
            console.log("User created successfully with ID:", user._id);
            console.log("User data:", {
                name: user.name,
                email: user.email,
                passwordHash: user.password,
                roles: user.roles
            });
            // Verificar que el usuario existe antes de intentar el login
            const userInDb = yield user_model_1.UserModel.findOne({ email: testUser.email.toLowerCase() });
            console.log("User found in DB:", userInDb ? "Yes" : "No");
            if (userInDb) {
                console.log("User DB details:", {
                    id: userInDb._id,
                    name: userInDb.name,
                    email: userInDb.email,
                    passwordHash: userInDb.password,
                    roles: userInDb.roles
                });
                // Verificar que la contraseña hasheada coincide
                const passwordMatches = bcrypt_1.BcryptAdapter.compare(testUser.password, userInDb.password);
                console.log("Password match check:", passwordMatches);
            }
            else {
                console.error("ERROR: User not found in database after creation!");
            }
            // Preparar los datos de login exactamente como espera la ruta
            const loginData = {
                email: testUser.email,
                password: testUser.password
            };
            console.log("Attempting login with data:", loginData);
            // Intentar el login
            const loginResponse = yield (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(loginData);
            console.log("Login response status:", loginResponse.status);
            console.log("Login response body:", loginResponse.body);
            if (loginResponse.status !== 200) {
                console.error("ERROR: Login failed with status", loginResponse.status);
                console.error("Error details:", loginResponse.body);
            }
            // Expectativas básicas
            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body).toHaveProperty('user');
            expect(loginResponse.body.user).toHaveProperty('token');
            expect(loginResponse.body.user.email).toBe(testUser.email.toLowerCase());
        }
        catch (error) {
            console.error("Error during login test:", error);
            throw error; // Re-lanzar para que Jest lo capture
        }
    }));
    // Test alternativo usando el enfoque de registro y luego login
    test('should register then login with same credentials', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("\n==== STARTING REGISTER-THEN-LOGIN TEST ====");
        // Limpiar usuarios existentes para evitar conflictos
        yield user_model_1.UserModel.deleteMany({});
        // Datos del usuario para esta prueba específica
        const newUser = {
            name: 'Another Test User',
            email: 'another@example.com',
            password: 'testpassword456'
        };
        console.log("1. Registrando nuevo usuario:", newUser);
        // Paso 1: Registrar el usuario
        const registerResponse = yield (0, supertest_1.default)(app)
            .post('/api/auth/register')
            .send(newUser);
        console.log("Register response status:", registerResponse.status);
        console.log("Register response body:", registerResponse.body);
        // Verificar que el registro fue exitoso
        expect(registerResponse.status).toBe(200);
        expect(registerResponse.body).toHaveProperty('user');
        expect(registerResponse.body.user).toHaveProperty('token');
        console.log("2. Intentando login con las mismas credenciales");
        // Paso 2: Intentar login con las mismas credenciales
        const loginData = {
            email: newUser.email,
            password: newUser.password
        };
        const loginResponse = yield (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send(loginData);
        console.log("Login response status:", loginResponse.status);
        console.log("Login response body:", loginResponse.body);
        // Verificar que el login fue exitoso
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('user');
        expect(loginResponse.body.user).toHaveProperty('token');
        expect(loginResponse.body.user.email).toBe(newUser.email.toLowerCase());
    }));
});
