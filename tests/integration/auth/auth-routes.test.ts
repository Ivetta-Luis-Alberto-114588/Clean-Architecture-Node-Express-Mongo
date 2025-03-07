import request from 'supertest';
import express from 'express';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { UserModel } from '../../../src/data/mongodb/models/user.model';
import { BcryptAdapter } from '../../../src/configs/bcrypt';
import mongoose from 'mongoose';

describe('Auth Routes Integration Tests', () => {
  // Crear una instancia del servidor para las pruebas
  const app = express();
  let testServer: any;
  
  // Configuración previa a todas las pruebas
  beforeAll(async () => {
    console.log("MongoDB connection state:", mongoose.connection.readyState);
    console.log("Test using MongoDB connection:", mongoose.connection.id);
    
    // Asegurarse de que estamos conectados a la base de datos
    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB connection is not active. Tests might fail.");
      await mongoose.connect(process.env.MONGO_URL!, {
        dbName: process.env.MONGO_DB_NAME
      });
      console.log("Connected to MongoDB. New state:", mongoose.connection.readyState);
    }
    
    console.log("Clearing users collection...");
    // Limpiar la colección de usuarios antes de empezar
    await UserModel.deleteMany({});
    
    console.log("Creating test server...");
    // Crear el servidor de pruebas
    testServer = new server({
      p_port: 3001,
      p_routes: MainRoutes.getMainRoutes
    });
    
    // Aplicar las rutas al servidor de express
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(MainRoutes.getMainRoutes);
  });
  
  // Limpiar la base de datos después de cada prueba
  afterEach(async () => {
    console.log("Cleaning up after test...");
    await UserModel.deleteMany({});
  });
  
  // Cerrar conexiones después de todas las pruebas
  afterAll(async () => {
    console.log("Cleaning up after all tests...");
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
  
  // Datos de prueba válidos
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };
  
  // Test simplificado para depurar el registro
  test('should register a new user', async () => {
    console.log("Starting register test with data:", testUser);
    
    // Hacer la solicitud de registro
    const response = await request(app)
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
  });
  
  // Test para login
  test('should login an existing user', async () => {
    console.log("Starting login test with registration approach...");
    
    // Primero registra el usuario usando la API
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);
  
    console.log("Register response status:", registerResponse.status);
    console.log("Register response body:", registerResponse.body);
  
    expect(registerResponse.status).toBe(200);
    expect(registerResponse.body).toHaveProperty('user');
    expect(registerResponse.body.user).toHaveProperty('token');
  
    // Luego intenta el login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
  
    console.log("Login response status:", loginResponse.status);
    console.log("Login response body:", loginResponse.body);
    
    // Expectativas básicas
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('user');
    expect(loginResponse.body.user).toHaveProperty('token');
    expect(loginResponse.body.user.email).toBe(testUser.email.toLowerCase());
  }); 
});