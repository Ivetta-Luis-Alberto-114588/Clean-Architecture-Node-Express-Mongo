// tests/integration/products/product-routes.test.ts

import request from 'supertest';
import express from 'express';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { UserModel } from '../../../src/data/mongodb/models/user.model';
import { ProductModel } from '../../../src/data/mongodb/models/products/product.model';
import { CategoryModel } from '../../../src/data/mongodb/models/products/category.model';
import { UnitModel } from '../../../src/data/mongodb/models/products/unit.model';
import { JwtAdapter } from '../../../src/configs/jwt';
import { BcryptAdapter } from '../../../src/configs/bcrypt';
import mongoose from 'mongoose';

describe('Product Routes Integration Tests', () => {
  // Crear una instancia del servidor para las pruebas
  const app = express();
  let testServer: any;
  
  // Token de autenticación
  let authToken: string;
  
  // IDs de prueba
  let categoryId: string;
  let unitId: string;
  let productId: string;
  
  // Configuración previa a todas las pruebas
  beforeAll(async () => {
    // Crear el servidor de pruebas
    testServer = new server({
      p_port: 3001,
      p_routes: MainRoutes.getMainRoutes
    });
    
    // Aplicar las rutas al servidor de express
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(MainRoutes.getMainRoutes);
    
    // Limpiar las colecciones
    if (mongoose.connection.readyState !== 0) {
      await UserModel.deleteMany({});
      await ProductModel.deleteMany({});
      await CategoryModel.deleteMany({});
      await UnitModel.deleteMany({});
    }
    
    // Crear un usuario y obtener token
    const user = await UserModel.create({
      name: 'test admin',
      email: 'admin@test.com',
      password: BcryptAdapter.hash('password123'),
      roles: ['ADMIN_ROLE']
    });
    
    authToken = await JwtAdapter.generateToken({ id: user._id.toString() }) || '';
  });
  
  // Limpiar la base de datos después de cada prueba
  afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await ProductModel.deleteMany({});
    }
  });
  
  // Limpiar la base de datos después de todas las pruebas
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await CategoryModel.deleteMany({});
      await UnitModel.deleteMany({});
      await UserModel.deleteMany({});
    }
  });
  
  // Crear categoría y unidad antes de cada prueba
  beforeEach(async () => {
    // Crear categoría
    const category = await CategoryModel.create({
      name: 'test category',
      description: 'test category description',
      isActive: true
    });
    categoryId = category._id.toString();
    
    // Crear unidad
    const unit = await UnitModel.create({
      name: 'test unit',
      description: 'test unit description',
      isActive: true
    });
    unitId = unit._id.toString();
  });
  
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
    test('should create a new product', async () => {
      // Asignar IDs dinámicamente
      const productData = {
        ...testProduct,
        category: categoryId,
        unit: unitId
      };
      
      // Hacer la solicitud de creación
      const response = await request(app)
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
      const savedProduct = await ProductModel.findById(productId);
      expect(savedProduct).not.toBeNull();
      if (savedProduct) {
        expect(savedProduct.name).toBe(productData.name.toLowerCase());
        expect(savedProduct.price).toBe(productData.price);
      }
    });
    
    test('should return 400 when trying to create a product with invalid data', async () => {
      // Datos inválidos (sin nombre)
      const invalidData = {
        ...testProduct,
        name: '',
        category: categoryId,
        unit: unitId
      };
      
      // Hacer la solicitud
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/products', () => {
    // Crear un producto antes de las pruebas
    beforeEach(async () => {
      // Crear producto de prueba
      const product = await ProductModel.create({
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
    });
    
    test('should get all products', async () => {
      // Hacer la solicitud
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verificar que se devuelven productos
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('name', testProduct.name.toLowerCase());
      }
    });
    
    test('should get products with pagination', async () => {
      // Hacer la solicitud con parámetros de paginación
      const response = await request(app)
        .get('/api/products?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verificar que se devuelven productos
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('GET /api/products/by-category/:categoryId', () => {
    // Crear un producto antes de las pruebas
    beforeEach(async () => {
      // Crear producto de prueba
      const product = await ProductModel.create({
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
    });
    
    test('should get products by category', async () => {
      // Hacer la solicitud
      const response = await request(app)
        .get(`/api/products/by-category/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verificar que se devuelven productos
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('name', testProduct.name.toLowerCase());
      }
    });
    
    test('should return 404 for non-existent category', async () => {
      // ID de categoría que no existe pero con formato válido
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      // Hacer la solicitud
      const response = await request(app)
        .get(`/api/products/by-category/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/products/:id', () => {
    // Crear un producto antes de las pruebas
    beforeEach(async () => {
      // Crear producto de prueba
      const product = await ProductModel.create({
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
    });
    
    test('should update a product', async () => {
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
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      // Verificar que el producto se actualizó
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', updateData.name.toLowerCase());
      expect(response.body).toHaveProperty('price', updateData.price);
      
      // Verificar la actualización en la base de datos
      const updatedProduct = await ProductModel.findById(productId);
      if (updatedProduct) {
        expect(updatedProduct.name).toBe(updateData.name.toLowerCase());
        expect(updatedProduct.price).toBe(updateData.price);
      }
    });
    
    test('should return 400 when update data is invalid', async () => {
      // Datos inválidos para la actualización (asegurarnos de que el DTO los valida como inválidos)
      const invalidData = {
        price: -50  // Precio negativo, que debería ser rechazado
      };
      
      // Hacer la solicitud
      const response = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);  // Esperamos 400 por datos inválidos
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('DELETE /api/products/:id', () => {
    // Crear un producto antes de las pruebas
    beforeEach(async () => {
      // Crear producto de prueba
      const product = await ProductModel.create({
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
    });
    
    test('should delete a product', async () => {
      // Hacer la solicitud
      const response = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verificar que el producto devuelto tiene el ID correcto
      expect(response.body).toHaveProperty('id', expect.any(String));
      
      // Verificar que ya no existe en la base de datos
      const deletedProduct = await ProductModel.findById(productId);
      expect(deletedProduct).toBeNull();
    });
    
    test('should return 404 when trying to delete non-existent product', async () => {
      // ID de producto que no existe pero con formato válido
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      // Hacer la solicitud
      const response = await request(app)
        .delete(`/api/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });
});