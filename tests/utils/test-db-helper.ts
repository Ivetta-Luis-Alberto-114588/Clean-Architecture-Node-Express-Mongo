// tests/utils/test-db-helper.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export class TestDbHelper {
    private static mongoServer: MongoMemoryServer;

    static async connect(): Promise<string> {
        this.mongoServer = await MongoMemoryServer.create();
        const mongoUri = this.mongoServer.getUri();

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        await mongoose.connect(mongoUri);
        return mongoUri;
    }

    static async disconnect(): Promise<void> {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        if (this.mongoServer) {
            await this.mongoServer.stop();
        }
    }

    static async clearDatabase(): Promise<void> {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }

    // Métodos alias para compatibilidad
    static async setupDatabase(): Promise<string> {
        return this.connect();
    }

    static async teardownDatabase(): Promise<void> {
        return this.disconnect();
    }
}