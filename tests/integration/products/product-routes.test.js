"use strict";
// tests/integration/products/product-routes.test.ts
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
const product_model_1 = require("../../../src/data/mongodb/models/products/product.model");
const category_model_1 = require("../../../src/data/mongodb/models/products/category.model");
const unit_model_1 = require("../../../src/data/mongodb/models/products/unit.model");
const jwt_1 = require("../../../src/configs/jwt");
const bcrypt_1 = require("../../../src/configs/bcrypt");
const mongoose_1 = __importDefault(require("mongoose"));
describe('Product Routes Integration Tests', () => {
    // Crear una instancia del servidor para las pruebas
    const app = (0, express_1.default)();
    let testServer;
    // Token de autenticación
    let authToken;
    // IDs de prueba
    let categoryId;
    let unitId;
    let productId;
    // Configuración previa a todas las pruebas
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Crear el servidor de pruebas
        testServer = new server_1.server({
            p_port: 3001,
            p_routes: routes_1.MainRoutes.getMainRoutes
        });
        // Aplicar las rutas al servidor de express
        app.use(express_1.default.json());
        app.use(express_1.default.urlencoded({ extended: true }));
        app.use(routes_1.MainRoutes.getMainRoutes);
        // Limpiar las colecciones
        if (mongoose_1.default.connection.readyState !== 0) {
            yield user_model_1.UserModel.deleteMany({});
            yield product_model_1.ProductModel.deleteMany({});
            yield category_model_1.CategoryModel.deleteMany({});
            yield unit_model_1.UnitModel.deleteMany({});
        }
        // Crear un usuario y obtener token
        const user = yield user_model_1.UserModel.create({
            name: 'test admin',
            email: 'admin@test.com',
            password: bcrypt_1.BcryptAdapter.hash('password123'),
            roles: ['ADMIN_ROLE']
        });
        authToken = (yield jwt_1.JwtAdapter.generateToken({ id: user._id.toString() })) || '';
    }));
    // Limpiar la base de datos después de cada prueba
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState !== 0) {
            yield product_model_1.ProductModel.deleteMany({});
        }
    }));
    // Limpiar la base de datos después de todas las pruebas
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (mongoose_1.default.connection.readyState !== 0) {
            yield category_model_1.CategoryModel.deleteMany({});
            yield unit_model_1.UnitModel.deleteMany({});
            yield user_model_1.UserModel.deleteMany({});
        }
    }));
    // Crear categoría y unidad antes de cada prueba
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Crear categoría
        const category = yield category_model_1.CategoryModel.create({
            name: 'test category',
            description: 'test category description',
            isActive: true
        });
        categoryId = category._id.toString();
        // Crear unidad
        const unit = yield unit_model_1.UnitModel.create({
            name: 'test unit',
            description: 'test unit description',
            isActive: true
        });
        unitId = unit._id.toString();
    }));
    // Datos de prueba para un producto
    const testProduct = {
        name: 'Test Product',
        description: 'Test product description',
        price: 100,
        stock: 10,
        category: '', // Se asignará dinámicamente
        unit: '', // Se asignará dinámicamente
        imgUrl: 'http://example.com/image.jpg',
        isActive: true
    };
    describe('POST /api/products', () => {
        test('should create a new product', () => __awaiter(void 0, void 0, void 0, function* () {
            // Asignar IDs dinámicamente
            const productData = Object.assign(Object.assign({}, testProduct), { category: categoryId, unit: unitId });
            // Hacer la solicitud de creación
            const response = yield (0, supertest_1.default)(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData)
                .expect(200);
            // Verificar la estructura de la respuesta
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', productData.name.toLowerCase());
            expect(response.body).toHaveProperty('price', productData.price);
            expect(response.body).toHaveProperty('stock', productData.stock);
            // Guardar el ID para pruebas posteriores
            productId = response.body.id;
            // Verificar que el producto se guardó en la base de datos
            const savedProduct = yield product_model_1.ProductModel.findById(productId);
            expect(savedProduct).not.toBeNull();
            if (savedProduct) {
                expect(savedProduct.name).toBe(productData.name.toLowerCase());
                expect(savedProduct.price).toBe(productData.price);
            }
        }));
        test('should return 400 when trying to create a product with invalid data', () => __awaiter(void 0, void 0, void 0, function* () {
            // Datos inválidos (sin nombre)
            const invalidData = Object.assign(Object.assign({}, testProduct), { name: '', category: categoryId, unit: unitId });
            // Hacer la solicitud
            const response = yield (0, supertest_1.default)(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
            // Verificar el mensaje de error
            expect(response.body).toHaveProperty('error');
        }));
    });
    describe('GET /api/products', () => {
        // Crear un producto antes de las pruebas
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Asegúrate de que categoryId y unitId estén definidos correctamente
            console.log('Creating product for GET test with categoryId:', categoryId, 'and unitId:', unitId);
            // Crear producto de prueba
            const product = yield product_model_1.ProductModel.create({
                name: testProduct.name.toLowerCase(),
                description: testProduct.description.toLowerCase(),
                price: testProduct.price,
                stock: testProduct.stock,
                category: categoryId, // Verifica que este valor sea correcto
                unit: unitId, // Verifica que este valor sea correcto
                imgUrl: testProduct.imgUrl,
                isActive: testProduct.isActive
            });
            productId = product._id.toString();
            // Verificar que el producto se creó
            const savedProduct = yield product_model_1.ProductModel.findById(productId);
            console.log('Saved product:', savedProduct ? 'Found' : 'Not found');
        }));
        test('should get all products', () => __awaiter(void 0, void 0, void 0, function* () {
            // Verificar que el producto existe antes de hacer la solicitud
            const productExists = yield product_model_1.ProductModel.findById(productId);
            console.log('Product exists before test:', productExists ? 'Yes' : 'No');
            // Hacer la solicitud
            const response = yield (0, supertest_1.default)(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            console.log('GET response body length:', response.body.length);
            // Verificar que se devuelven productos
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('name', testProduct.name.toLowerCase());
            }
        }));
    });
    describe('GET /api/products/by-category/:categoryId', () => {
        // Añade este beforeEach justo aquí
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Crear producto de prueba con la categoría correcta
            const product = yield product_model_1.ProductModel.create({
                name: testProduct.name.toLowerCase(),
                description: testProduct.description.toLowerCase(),
                price: testProduct.price,
                stock: testProduct.stock,
                category: categoryId, // Asegúrate de que este sea el ID correcto
                unit: unitId,
                imgUrl: testProduct.imgUrl,
                isActive: testProduct.isActive
            });
            productId = product._id.toString();
            // Verificación opcional para debug
            console.log(`Producto creado con ID: ${productId} y categoría: ${categoryId}`);
        }));
        test('should get products by category', () => __awaiter(void 0, void 0, void 0, function* () {
            // Hacer la solicitud
            const response = yield (0, supertest_1.default)(app)
                .get(`/api/products/by-category/${categoryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            // Verificar que se devuelven productos
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
            if (response.body.length > 0) {
                expect(response.body[0]).toHaveProperty('name', testProduct.name.toLowerCase());
            }
        }));
        test('should return 404 for non-existent category', () => __awaiter(void 0, void 0, void 0, function* () {
            // ID de categoría que no existe pero con formato válido
            const nonExistentId = new mongoose_1.default.Types.ObjectId().toString();
            // Hacer la solicitud
            const response = yield (0, supertest_1.default)(app)
                .get(`/api/products/by-category/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            // Verificar el mensaje de error
            expect(response.body).toHaveProperty('error');
        }));
    });
    describe('PUT /api/products/:id', () => {
        // Crear un producto antes de las pruebas
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Crear producto de prueba
            const product = yield product_model_1.ProductModel.create({
                name: testProduct.name.toLowerCase(),
                description: testProduct.description.toLowerCase(),
                price: testProduct.price,
                stock: testProduct.stock,
                category: categoryId,
                unit: unitId,
                imgUrl: testProduct.imgUrl,
                isActive: testProduct.isActive
            });
            productId = product._id.toString();
        }));
        test('should update a product', () => __awaiter(void 0, void 0, void 0, function* () {
            // Datos para actualizar
            const updateData = {
                name: 'Updated Product Name',
                price: 200,
                description: 'Updated product description',
                stock: 20,
                category: categoryId,
                unit: unitId,
                imgUrl: testProduct.imgUrl,
                isActive: true
            };
            // Hacer la solicitud
            const response = yield (0, supertest_1.default)(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);
            // Verificar que el producto se actualizó
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', updateData.name.toLowerCase());
            expect(response.body).toHaveProperty('price', updateData.price);
            // Verificar la actualización en la base de datos
            const updatedProduct = yield product_model_1.ProductModel.findById(productId);
            if (updatedProduct) {
                expect(updatedProduct.name).toBe(updateData.name.toLowerCase());
                expect(updatedProduct.price).toBe(updateData.price);
            }
        }));
        test('should return 400 when update data is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            // Datos inválidos para la actualización (asegurarnos de que el DTO los valida como inválidos)
            const invalidData = {
                price: -50 // Precio negativo, que debería ser rechazado
            };
            // Hacer la solicitud
            const response = yield (0, supertest_1.default)(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400); // Esperamos 400 por datos inválidos
            // Verificar el mensaje de error
            expect(response.body).toHaveProperty('error');
        }));
    });
    describe('DELETE /api/products/:id', () => {
        // Crear un producto antes de cada prueba
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Crear producto de prueba - asegurémonos de que realmente se crea
            const product = yield product_model_1.ProductModel.create({
                name: testProduct.name.toLowerCase(),
                description: testProduct.description.toLowerCase(),
                price: testProduct.price,
                stock: testProduct.stock,
                category: categoryId,
                unit: unitId,
                imgUrl: testProduct.imgUrl,
                isActive: testProduct.isActive
            });
            // Asignar el ID a la variable productId
            productId = product._id.toString();
            // Verificar que el producto se creó correctamente
            console.log(`Producto de prueba creado con ID: ${productId}`);
            const createdProduct = yield product_model_1.ProductModel.findById(productId);
            if (!createdProduct) {
                console.error('Error: El producto no se encuentra inmediatamente después de crearlo');
            }
        }));
        test('should delete a product', () => __awaiter(void 0, void 0, void 0, function* () {
            // Verificación adicional antes de intentar eliminar
            const productBeforeDelete = yield product_model_1.ProductModel.findById(productId);
            console.log(`Verificando producto antes de eliminar - Existe: ${!!productBeforeDelete}`);
            // Hacer la solicitud - añadimos manejadores adicionales en caso de error
            const response = yield (0, supertest_1.default)(app)
                .delete(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .catch(err => {
                console.error(`Error al eliminar producto (ID: ${productId}):`, err.message);
                if (err.response) {
                    console.error('Cuerpo de respuesta:', err.response.body);
                }
                throw err;
            });
            // Verificar que el producto devuelto tiene el ID correcto
            expect(response.body).toHaveProperty('id', expect.any(String));
            // Verificar que ya no existe en la base de datos
            const deletedProduct = yield product_model_1.ProductModel.findById(productId);
            expect(deletedProduct).toBeNull();
        }));
        test('should return 404 when trying to delete non-existent product', () => __awaiter(void 0, void 0, void 0, function* () {
            // ID de producto que no existe pero con formato válido
            const nonExistentId = new mongoose_1.default.Types.ObjectId().toString();
            // Hacer la solicitud
            const response = yield (0, supertest_1.default)(app)
                .delete(`/api/products/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            // Verificar el mensaje de error
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Producto no encontrado');
        }));
    });
});
