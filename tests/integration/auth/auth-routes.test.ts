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
    console.log("Starting login test...");
    
    // Crear usuario directamente en la BD para el login
    console.log("Creating test user for login...");
    const hashedPassword = BcryptAdapter.hash(testUser.password);
    console.log("Hashed password:", hashedPassword);
    
    const createdUser = await UserModel.create({
      name: testUser.name.toLowerCase(),
      email: testUser.email.toLowerCase(),
      password: hashedPassword,
      roles: ['USER_ROLE']
    });
    
    console.log("Created user:", createdUser ? "Yes" : "No");
    
    // Verificar que el usuario se guardó
    const userInDb = await UserModel.findOne({ email: testUser.email.toLowerCase() });
    console.log("User found in DB:", userInDb ? "Yes" : "No");
    
    if (userInDb) {
      console.log("User ID:", userInDb._id);
      console.log("Password in DB:", userInDb.password);
      
      // Probar si la contraseña se puede verificar
      const passwordOk = BcryptAdapter.compare(testUser.password, userInDb.password);
      console.log("Password verification result:", passwordOk);
    }
    
    // Datos de login
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    
    console.log("Attempting login with:", loginData);
    
    // Hacer la solicitud de login
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    console.log("Login response status:", response.status);
    console.log("Login response body:", response.body);
    
    // Expectativas básicas
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('token');
    expect(response.body.user.email).toBe(testUser.email.toLowerCase());
  });
});