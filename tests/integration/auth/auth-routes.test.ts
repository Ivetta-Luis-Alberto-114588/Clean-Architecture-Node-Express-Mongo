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
  
  // Limpiar la base de datos después de todas las pruebas
  afterAll(async () => {
    console.log("Cleaning up after all tests...");
    if (mongoose.connection.readyState !== 0) {
      await UserModel.deleteMany({});
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
  
  // Test para login - MODIFICADO para mejorar la depuración
  test('should login an existing user', async () => {
    console.log("\n==== STARTING LOGIN TEST ====");
    console.log("Cleaning up database before login test...");
    
    // Limpiar usuarios existentes para evitar conflictos
    await UserModel.deleteMany({});
    
    // Crear un usuario directamente en la base de datos para el login
    const hashedPassword = BcryptAdapter.hash(testUser.password);
    console.log("Creating test user with hashed password:", hashedPassword);
    
    try {
      const user = await UserModel.create({
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
      const userInDb = await UserModel.findOne({ email: testUser.email.toLowerCase() });
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
        const passwordMatches = BcryptAdapter.compare(testUser.password, userInDb.password);
        console.log("Password match check:", passwordMatches);
      } else {
        console.error("ERROR: User not found in database after creation!");
      }
      
      // Preparar los datos de login exactamente como espera la ruta
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };
      console.log("Attempting login with data:", loginData);
      
      // Intentar el login
      const loginResponse = await request(app)
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
      
    } catch (error) {
      console.error("Error during login test:", error);
      throw error; // Re-lanzar para que Jest lo capture
    }
  });
  
  // Test alternativo usando el enfoque de registro y luego login
  test('should register then login with same credentials', async () => {
    console.log("\n==== STARTING REGISTER-THEN-LOGIN TEST ====");
    
    // Limpiar usuarios existentes para evitar conflictos
    await UserModel.deleteMany({});
    
    // Datos del usuario para esta prueba específica
    const newUser = {
      name: 'Another Test User',
      email: 'another@example.com',
      password: 'testpassword456'
    };
    
    console.log("1. Registrando nuevo usuario:", newUser);
    
    // Paso 1: Registrar el usuario
    const registerResponse = await request(app)
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
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    console.log("Login response status:", loginResponse.status);
    console.log("Login response body:", loginResponse.body);
    
    // Verificar que el login fue exitoso
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('user');
    expect(loginResponse.body.user).toHaveProperty('token');
    expect(loginResponse.body.user.email).toBe(newUser.email.toLowerCase());
  });
});