import mongoose from 'mongoose';

// Ampliar el tiempo de espera por defecto de las pruebas
jest.setTimeout(10000);

// Conectar a MongoDB antes de las pruebas
beforeAll(async () => {
  if (!process.env.MONGO_URL) {
    throw new Error('MongoDB URI not available');
  }
  
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.MONGO_DB_NAME
  });
});

// Limpiar la base de datos después de cada prueba
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Desconectar de MongoDB después de todas las pruebas
afterAll(async () => {
  await mongoose.connection.close();
});