// tests/setup.ts

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Setup global para tests
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    // Cerrar cualquier conexión existente
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    // Crear servidor MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Conectar a MongoDB
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    // Limpiar y cerrar conexiones
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }

    if (mongoServer) {
        await mongoServer.stop();
    }
});

// Limpiar entre tests
afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
});
