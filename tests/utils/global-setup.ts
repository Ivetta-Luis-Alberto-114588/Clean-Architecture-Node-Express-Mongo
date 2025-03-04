import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export default async function globalSetup() {
  // Iniciar el servidor MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Guardar la URI para usarla en las pruebas
  process.env.MONGO_URL = mongoUri;
  process.env.MONGO_DB_NAME = 'test-db';
  
  // Otras variables de entorno para tests
  process.env.PORT = '3001';
  process.env.JWT_SEED = 'test-jwt-seed';
  process.env.MERCADO_PAGO_ACCESS_TOKEN = 'TEST-xxxx-TEST';
  process.env.MERCADO_PAGO_PUBLIC_KEY = 'TEST-xxxx-TEST';
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.URL_RESPONSE_WEBHOOK_NGROK = 'http://localhost:3001/';
  process.env.NODE_ENV = 'test';

  // Guardar la instancia de MongoMemoryServer para poder cerrarla después
  (global as any).__MONGO_SERVER__ = mongoServer;
}