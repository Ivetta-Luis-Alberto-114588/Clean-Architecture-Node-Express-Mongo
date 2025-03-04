import request from 'supertest';
import express from 'express';
import { server } from '../../../src/presentation/server';
import { MainRoutes } from '../../../src/presentation/routes';
import { UserModel } from '../../../src/data/mongodb/models/user.model';
import { BcryptAdapter } from '../../../src/configs/bcrypt';

describe('Auth Routes Integration Tests', () => {
  // Crear una instancia del servidor para las pruebas
  const app = express();
  let testServer: any;
  
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
  });
  
  // Limpiar la base de datos después de cada prueba
  afterEach(async () => {
    await UserModel.deleteMany({});
  });
  
  // Datos de prueba
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };
  
  describe('POST /api/auth/register', () => {
    test('should register a new user and return user with token', async () => {
      // Hacer la solicitud de registro
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200);
      
      // Verificar la estructura de la respuesta
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name', testUser.name.toLowerCase());
      expect(response.body.user).toHaveProperty('email', testUser.email.toLowerCase());
      expect(response.body.user).toHaveProperty('token');
      
      // Verificar que el usuario se guardó en la base de datos
      const savedUser = await UserModel.findOne({ email: testUser.email.toLowerCase() });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.name).toBe(testUser.name.toLowerCase());
      
      // La contraseña debe estar hasheada
      expect(savedUser?.password).not.toBe(testUser.password);
      expect(BcryptAdapter.compare(testUser.password, savedUser!.password)).toBe(true);
    });
    
    test('should return 400 when trying to register with existing email', async () => {
      // Crear un usuario primero
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(200);
      
      // Intentar registrar otro usuario con el mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
    
    test('should return 400 when sending invalid data', async () => {
      // Datos inválidos (sin contraseña)
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('password is required');
    });
  });
  
  describe('POST /api/auth/login', () => {
    // Crear un usuario de prueba antes de las pruebas de login
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });
    
    test('should log in an existing user and return user with token', async () => {
      // Datos de login
      const loginData = {
        email: testUser.email,
        password: testUser.password
      };
      
      // Hacer la solicitud de login
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);
      
      // Verificar la estructura de la respuesta
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', testUser.email.toLowerCase());
      expect(response.body.user).toHaveProperty('token');
    });
    
    test('should return 400 when trying to log in with invalid credentials', async () => {
      // Datos de login inválidos
      const invalidLoginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };
      
      // Hacer la solicitud de login
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(400);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password is not valid');
    });
    
    test('should return 400 when user does not exist', async () => {
      // Datos de login con email inexistente
      const nonExistingUserData = {
        email: 'nonexisting@example.com',
        password: 'password123'
      };
      
      // Hacer la solicitud de login
      const response = await request(app)
        .post('/api/auth/login')
        .send(nonExistingUserData)
        .expect(400);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('user does not exists');
    });
  });
  
  describe('GET /api/auth', () => {
    // Token de prueba
    let authToken: string;
    
    // Crear un usuario y obtener token antes de las pruebas
    beforeEach(async () => {
      // Registrar usuario
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      // Guardar el token para las pruebas
      authToken = response.body.user.token;
    });
    
    test('should get user profile when authenticated', async () => {
      // Hacer la solicitud con el token
      const response = await request(app)
        .get('/api/auth')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verificar que se devuelve la información del usuario
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('name', testUser.name.toLowerCase());
      expect(response.body.user).toHaveProperty('email', testUser.email.toLowerCase());
    });
    
    test('should return 401 when no token is provided', async () => {
      // Hacer la solicitud sin token
      const response = await request(app)
        .get('/api/auth')
        .expect(401);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No authorization');
    });
    
    test('should return 401 when invalid token is provided', async () => {
      // Hacer la solicitud con un token inválido
      const response = await request(app)
        .get('/api/auth')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      // Verificar el mensaje de error
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token invalid');
    });
  });
});