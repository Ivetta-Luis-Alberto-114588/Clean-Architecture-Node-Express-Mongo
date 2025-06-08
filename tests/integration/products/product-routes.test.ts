import request from 'supertest';
import mongoose from 'mongoose';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { UserModel } from '../../../src/data/mongodb/models/user.model';
import { ProductModel } from '../../../src/data/mongodb/models/products/product.model';
import { CategoryModel } from '../../../src/data/mongodb/models/products/category.model';
import { UnitModel } from '../../../src/data/mongodb/models/products/unit.model';
import { BcryptAdapter } from '../../../src/configs/bcrypt';
import { JwtAdapter } from '../../../src/configs/jwt';
import { envs } from '../../../src/configs/envs';

describe('Product Routes Integration Tests', () => {
  // Crear una instancia del servidor para las pruebas
  let testServer: server;
  // Datos para autenticación
  let authToken: string;
  let testUser: any;
  let testCategory: any;
  let testUnit: any;
  let testProduct: any;
  let categoryId: string;
  let unitId: string;
  let productId: string;
  beforeAll(async () => {
    console.log("Setting up product tests...");

    // 1. Crear instancia del servidor
    testServer = new server({
      p_port: 3001,
      p_routes: MainRoutes.getMainRoutes
    });    // 2. Limpiar datos de prueba previos para evitar conflictos
    await Promise.all([
      UserModel.deleteMany({ email: { $in: ['product-admin@test.com', 'admin@test.com'] } }),
      ProductModel.deleteMany({}),
      CategoryModel.deleteMany({}),
      UnitModel.deleteMany({})
    ]);// 3. Crear usuario de prueba para autenticación
    const hashedPassword = BcryptAdapter.hash('password123');
    testUser = await UserModel.create({
      name: 'product test admin',
      email: 'product-admin@test.com',
      password: hashedPassword,
      roles: ['ADMIN_ROLE'] // Asegúrate de usar un rol que tenga permisos para productos
    });
    console.log("Test admin created with ID:", testUser._id);// 4. Generar token de autenticación
    authToken = await JwtAdapter.generateToken({ id: testUser._id }, '2h') as string;
    console.log("Auth token generated for tests");// 5. Crear categoría de prueba
    testCategory = await CategoryModel.create({
      name: 'test category',
      description: 'category for integration tests'
    });
    categoryId = testCategory._id.toString();
    console.log("Test category created with ID:", categoryId);

    // 6. Crear unidad de prueba
    testUnit = await UnitModel.create({
      name: 'test unit',
      description: 'unit for integration tests'
    });
    unitId = testUnit._id.toString();
    console.log("Test unit created with ID:", unitId);

    // 7. Crear producto de prueba
    testProduct = await ProductModel.create({
      name: 'test product',
      description: 'product for integration tests',
      price: 10.99,
      stock: 100,
      category: testCategory._id,  // Usar ObjectId de la categoría
      unit: testUnit._id           // Usar ObjectId de la unidad
    });
    productId = testProduct._id.toString();
    console.log("Test product created with ID:", productId);
  });  afterAll(async () => {
    console.log("Cleaning up after product tests...");

    await Promise.all([
      UserModel.deleteMany({ email: 'product-admin@test.com' }),
      ProductModel.deleteMany({}),
      CategoryModel.deleteMany({}),
      UnitModel.deleteMany({})
    ]);

    // Si necesitas cerrar la conexión, puedes hacerlo aquí
    // await mongoose.connection.close();
  });
  // Tests para la creación de productos
  describe('POST /api/admin/products', () => {
    test('should create a new product', async () => {
      const productData = {
        name: 'New Test Product',
        description: 'Created during integration test',
        price: 19.99,
        stock: 50,
        category: testCategory._id,  // Usar ObjectId de la categoría
        unit: testUnit._id           // Usar ObjectId de la unidad
      };

      const response = await request(testServer.app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      // Verificar la estructura de la respuesta
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', productData.name.toLowerCase());
      expect(response.body).toHaveProperty('price', productData.price);

      // Opcional: Verificar que el producto se creó en la BD
      const createdProduct = await ProductModel.findById(response.body.id);
      expect(createdProduct).toBeTruthy();
      expect(createdProduct?.name).toBe(productData.name.toLowerCase());
    });

    test('should return 400 when trying to create a product with invalid data', async () => {
      const invalidData = {
        // Omitir campos requeridos como name o price
        description: 'Invalid product data'
      };

      const response = await request(testServer.app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
    });
  });  // Tests para obtener productos
  describe('GET /api/products', () => {
    test('should get all products', async () => {
      // Create a test product for this specific test
      const testProductForGet = await ProductModel.create({
        name: 'test product for get',
        description: 'product for get test',
        price: 10.99,
        stock: 100,
        category: testCategory._id,
        unit: testUnit._id
      });

      const response = await request(testServer.app)
        .get('/api/products')
        .expect(200);

      // Verificar que se devuelve la estructura { total, products }
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
      if (response.body.products.length > 0) {
        expect(response.body.products[0]).toHaveProperty('name', testProductForGet.name.toLowerCase());
      }
    });
  });  // Tests para obtener productos por categoría
  describe('GET /api/products/by-category/:categoryId', () => {
    test('should get products by category', async () => {
      // Create a test product for this specific test
      const testProductForCategory = await ProductModel.create({
        name: 'test product for category',
        description: 'product for category test',
        price: 15.99,
        stock: 50,
        category: testCategory._id,
        unit: testUnit._id
      });      const response = await request(testServer.app)
        .get(`/api/products/by-category/${categoryId}`)
        .expect(200);

      // Verificar que se devuelven productos con el formato correcto {total, products}
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(1);
      if (response.body.products.length > 0) {
        expect(response.body.products[0]).toHaveProperty('name', testProductForCategory.name.toLowerCase());
      }
    });

    test('should return 404 for non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await request(testServer.app)
        .get(`/api/products/by-category/${nonExistentId}`)
        .expect(404);
    });
  });  // Tests para actualizar productos
  describe('PUT /api/admin/products/:id', () => {
    test('should update a product', async () => {
      // Create a test product for this specific test
      const testProductForUpdate = await ProductModel.create({
        name: 'test product for update',
        description: 'product for update test',
        price: 20.99,
        stock: 75,
        category: testCategory._id,
        unit: testUnit._id
      });

      const updateData = {
        name: 'Updated Product Name',
        price: 29.99
      };

      const response = await request(testServer.app)
        .put(`/api/admin/products/${testProductForUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Verificar que el producto se actualizó
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', updateData.name.toLowerCase());
      expect(response.body).toHaveProperty('price', updateData.price);

      // Opcional: Verificar en la BD
      const updatedProduct = await ProductModel.findById(testProductForUpdate._id);
      expect(updatedProduct?.name).toBe(updateData.name.toLowerCase());
      expect(updatedProduct?.price).toBe(updateData.price);
    });

    test('should return 400 when update data is invalid', async () => {
      // Create a test product for this specific test
      const testProductForInvalidUpdate = await ProductModel.create({
        name: 'test product for invalid update',
        description: 'product for invalid update test',
        price: 25.99,
        stock: 60,
        category: testCategory._id,
        unit: testUnit._id
      });

      const invalidData = {
        price: 'not-a-number' // Precio inválido
      };

      const response = await request(testServer.app)
        .put(`/api/admin/products/${testProductForInvalidUpdate._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);  // Esperamos 400 por datos inválidos

      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
    });
  });
  // Tests para eliminar productos
  describe('DELETE /api/admin/products/:id', () => {
    test('should delete a product', async () => {
      // Crear un producto específico para eliminarlo
      const productToDelete = await ProductModel.create({
        name: 'Product to delete',
        description: 'This product will be deleted',
        price: 15.50,
        stock: 20,
        category: testCategory._id,  // Usar ObjectId de la categoría
        unit: testUnit._id           // Usar ObjectId de la unidad
      });
      const productIdToDelete = productToDelete._id.toString();
      console.log("Producto de prueba creado con ID:", productIdToDelete);

      await request(testServer.app)
        .delete(`/api/admin/products/${productIdToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .catch(err => {
          console.error(`Error al eliminar producto (ID: ${productIdToDelete}):`, err.message);
          if (err.response) {
            console.error('Cuerpo de respuesta:', err.response.body);
          }
          throw err;
        });

      // Verificar que el producto ha sido eliminado
      const deletedProduct = await ProductModel.findById(productIdToDelete);
      expect(deletedProduct).toBeNull();
    });

    test('should return 404 when trying to delete non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const response = await request(testServer.app)
        .delete(`/api/admin/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Producto no encontrado');
    });
  });
});