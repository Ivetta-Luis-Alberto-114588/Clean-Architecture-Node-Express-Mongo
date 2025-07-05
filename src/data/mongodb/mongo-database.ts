import mongoose from "mongoose";
import logger from "../../configs/logger";

interface IOptions{
    p_mongoUrl: string,
    p_dbName: string
}


export class MongoDatabase {

    static async connect(options: IOptions){

        const {p_dbName, p_mongoUrl} = options

        try {
            console.log('[MONGODB] Starting MongoDB connection...');
            logger.info('[MONGODB] Starting MongoDB connection', { 
                dbName: p_dbName,
                hasUrl: !!p_mongoUrl,
                urlLength: p_mongoUrl?.length
            });

            // Add connection event listeners
            mongoose.connection.on('connecting', () => {
                console.log('[MONGODB] Connecting to MongoDB...');
                logger.info('[MONGODB] Connecting to MongoDB');
            });

            mongoose.connection.on('connected', () => {
                console.log('[MONGODB] Connected to MongoDB successfully');
                logger.info('[MONGODB] Connected to MongoDB successfully', {
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    name: mongoose.connection.name
                });
            });

            mongoose.connection.on('error', (error) => {
                console.error('[MONGODB] MongoDB connection error:', error);
                logger.error('[MONGODB] MongoDB connection error', { error: error.message });
            });

            mongoose.connection.on('disconnected', () => {
                console.log('[MONGODB] MongoDB disconnected');
                logger.warn('[MONGODB] MongoDB disconnected');
            });
            
            await mongoose.connect(p_mongoUrl, {
                dbName: p_dbName,
                maxPoolSize: 100,  // Aumenta este valor según tu carga
                minPoolSize: 10,   // Mantén algunas conexiones abiertas
                connectTimeoutMS: 30000,  // Aumenta el tiempo de espera para conexiones
                socketTimeoutMS: 45000,   // Aumenta el tiempo de espera para operaciones
            })

            console.log('[MONGODB] Mongo connected successfully');
            console.log('[MONGODB] App using MongoDB connection ID:', mongoose.connection.id);
            logger.info('[MONGODB] MongoDB connection established', {
                connectionId: mongoose.connection.id,
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                dbName: mongoose.connection.name
            });

            return true

        } catch (error) {
            console.error('[MONGODB] Mongo connection error:', error);
            logger.error('[MONGODB] MongoDB connection failed', { 
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
}