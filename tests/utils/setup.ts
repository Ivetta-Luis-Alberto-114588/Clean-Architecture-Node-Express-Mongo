// tests/utils/setup.ts
import mongoose from 'mongoose';

// Ampliar el tiempo de espera por defecto de las pruebas
jest.setTimeout(30000); // Aumentar a 30 segundos

// Conectar a MongoDB antes de las pruebas
beforeAll(async () => {
  console.log("Setting up MongoDB connection for tests...");
  console.log("MongoDB URI:", process.env.MONGO_URL);
  console.log("MongoDB Name:", process.env.MONGO_DB_NAME);
  
  if (!process.env.MONGO_URL) {
    throw new Error('MongoDB URI not available');
  }
  
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.MONGO_DB_NAME
  });
  
  console.log("Connected to MongoDB. State:", mongoose.connection.readyState);
  console.log("Connection ID:", mongoose.connection.id);
});



// Limpiar la base de datos después de cada prueba
afterEach(async () => {
  console.log("Cleaning database after test...");
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Desconectar de MongoDB después de todas las pruebas
afterAll(async () => {
  console.log("Disconnecting from MongoDB...");
  await mongoose.connection.close();
});