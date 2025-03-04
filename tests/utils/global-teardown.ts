export default async function globalTeardown() {
    // Recuperar la instancia de MongoMemoryServer
    const mongoServer = (global as any).__MONGO_SERVER__;
    
    // Cerrar la conexión a MongoDB
    if (mongoServer) {
      await mongoServer.stop();
    }
  }