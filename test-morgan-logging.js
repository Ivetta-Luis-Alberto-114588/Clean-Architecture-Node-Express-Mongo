// test-morgan-logging.js
// Script para probar que Morgan está loggeando correctamente las peticiones HTTP

const logger = require('./dist/configs/logger').default;
const { MorganLogger } = require('./dist/configs/morgan.config');

console.log('=== TEST DE MORGAN LOGGING ===');
console.log('Iniciando servidor de prueba para verificar Morgan...\n');

// Importar dependencias necesarias
const express = require('express');
const http = require('http');

// Crear una aplicación Express simple
const app = express();

// Configurar el logger middleware (simular el flujo real)
const { v4: uuidv4 } = require('uuid');
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.id = requestId;
  req.requestId = requestId;
  req.startTime = Date.now();
  next();
});

// Configurar Morgan
const morganLogger = new MorganLogger({
  logger: logger,
  environment: 'test'
});

const morganMiddlewares = morganLogger.getCompleteMiddleware();
morganMiddlewares.forEach(middleware => {
  app.use(middleware);
});

// Configurar parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crear rutas de prueba
app.get('/api/test', (req, res) => {
  console.log('📍 Endpoint GET /api/test llamado');
  res.json({ 
    message: 'GET request successful', 
    timestamp: new Date().toISOString(),
    requestId: req.requestId 
  });
});

app.post('/api/test', (req, res) => {
  console.log('📍 Endpoint POST /api/test llamado');
  res.json({ 
    message: 'POST request successful', 
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    requestId: req.requestId 
  });
});

app.get('/api/test-error', (req, res) => {
  console.log('📍 Endpoint ERROR /api/test-error llamado');
  res.status(500).json({ 
    error: 'Error de prueba',
    timestamp: new Date().toISOString(),
    requestId: req.requestId 
  });
});

// Iniciar servidor
const server = app.listen(3001, () => {
  console.log('🚀 Servidor de prueba iniciado en puerto 3001');
  
  // Hacer peticiones de prueba después de un breve delay
  setTimeout(async () => {
    console.log('\n📡 INICIANDO PETICIONES DE PRUEBA...\n');
    
    try {
      // Test 1: GET simple
      console.log('1️⃣ Realizando petición GET...');
      const getResponse = await fetch('http://localhost:3001/api/test');
      const getData = await getResponse.json();
      console.log('✅ GET Response:', getData.message);
      
      // Test 2: POST con body
      console.log('\n2️⃣ Realizando petición POST con body...');
      const postResponse = await fetch('http://localhost:3001/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Morgan-Test-Client',
          'X-Test-Header': 'valor-de-prueba'
        },
        body: JSON.stringify({
          testField: 'valor de prueba',
          number: 12345,
          nested: {
            field: 'valor anidado'
          }
        })
      });
      const postData = await postResponse.json();
      console.log('✅ POST Response:', postData.message);
      
      // Test 3: Error 500
      console.log('\n3️⃣ Realizando petición que genera error...');
      const errorResponse = await fetch('http://localhost:3001/api/test-error');
      const errorData = await errorResponse.json();
      console.log('✅ ERROR Response:', errorData.error);
      
      console.log('\n🎉 TODAS LAS PETICIONES COMPLETADAS');
      console.log('📋 Verifica arriba que Morgan haya loggeado los detalles de cada petición');
      
    } catch (error) {
      console.error('❌ Error realizando peticiones:', error.message);
    } finally {
      // Cerrar servidor después de las pruebas
      setTimeout(() => {
        console.log('\n🔚 Cerrando servidor de prueba...');
        server.close();
        process.exit(0);
      }, 2000);
    }
  }, 1000);
});

// Manejar errores del servidor
server.on('error', (error) => {
  console.error('❌ Error del servidor:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});
