// tests/integration/auth/auth-routes.test.ts
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
    
    // Verificar que no haya usuarios en la BD antes de empezar
    const usersBeforeTest = await UserModel.find();
    console.log("Users before test:", usersBeforeTest.length);
    
    // Hacer la solicitud de registro
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    console.log("Register response status:", response.status);
    console.log("Register response body:", response.body);
    
    // Esperar un momento para que MongoDB se actualice
    console.log("Waiting for MongoDB to update...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar usuarios en la BD después del registro
    const usersAfterTest = await UserModel.find();
    console.log("Users after test:", usersAfterTest.length);
    
    if (usersAfterTest.length > 0) {
      console.log("First user email:", usersAfterTest[0].email);
      console.log("First user name:", usersAfterTest[0].name);
    }
    
    // Buscar específicamente el usuario que intentamos registrar
    const savedUser = await UserModel.findOne({ email: testUser.email.toLowerCase() });
    console.log("Found registered user:", savedUser ? "Yes" : "No");
    
    // Comparar las contraseñas
    if (savedUser) {
      const passwordMatch = BcryptAdapter.compare(testUser.password, savedUser.password);
      console.log("Password match:", passwordMatch);
    }
    
    // Expectativas básicas para ver si el test pasa
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(usersAfterTest.length).toBe(1);
    expect(savedUser).not.toBeNull();
  });
  
  // Test simplificado para depurar el login
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
    expect(userInDb).not.toBeNull();
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });
});