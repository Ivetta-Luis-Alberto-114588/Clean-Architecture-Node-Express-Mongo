import { envs } from "./configs/envs"
import { MongoDatabase } from "./data/mongodb/mongo-database"
import { MainRoutes } from "./presentation/routes"
import { server } from "./presentation/server"
import logger from "./configs/logger"

// Capture uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    console.error('[STARTUP-CRITICAL] Uncaught Exception:', error);
    logger.error('[STARTUP-CRITICAL] Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[STARTUP-CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
    logger.error('[STARTUP-CRITICAL] Unhandled Rejection', { reason, promise });
    process.exit(1);
});

(()=>{
    console.log('[STARTUP] Starting application...');
    logger.info('[STARTUP] Starting application');
    main()
})()

async function main() {
    try {
        console.log('[STARTUP] Main function started');
        logger.info('[STARTUP] Main function started');

        // Log environment variables (without sensitive data)
        console.log('[STARTUP] Environment check:', {
            NODE_ENV: process.env.NODE_ENV,
            PORT: envs.PORT,
            MONGO_DB_NAME: envs.MONGO_DB_NAME,
            HAS_MONGO_URL: !!envs.MONGO_URL,
            HAS_JWT_SEED: !!envs.JWT_SEED,
            HAS_TELEGRAM_BOT_TOKEN: !!envs.TELEGRAM_BOT_TOKEN,
            HAS_EMAIL_USER: !!envs.EMAIL_USER
        });
        logger.info('[STARTUP] Environment check completed');

        console.log('[STARTUP] Connecting to MongoDB...');
        logger.info('[STARTUP] Connecting to MongoDB', { 
            dbName: envs.MONGO_DB_NAME,
            hasUrl: !!envs.MONGO_URL 
        });

        //await bd
        //el servidor no se ejecuta hasta que la bd no se haya conectado
        await MongoDatabase.connect({
            p_mongoUrl: envs.MONGO_URL,
            p_dbName: envs.MONGO_DB_NAME
        })

        console.log('[STARTUP] MongoDB connected successfully');
        logger.info('[STARTUP] MongoDB connected successfully');

        console.log('[STARTUP] Initializing routes...');
        logger.info('[STARTUP] Initializing routes');

        const routes = MainRoutes.getMainRoutes;
        console.log('[STARTUP] Routes initialized');
        logger.info('[STARTUP] Routes initialized');

        console.log('[STARTUP] Starting server...');
        logger.info('[STARTUP] Starting server', { port: envs.PORT });

        //server, le debo pasar el puerto y las rutas
        const serverInstance = new server({
            p_port: envs.PORT, 
            p_routes: routes 
        });

        console.log('[STARTUP] Server instance created, calling start()...');
        logger.info('[STARTUP] Server instance created, calling start()');

        serverInstance.start();

        console.log('[STARTUP] Server start() called successfully');
        logger.info('[STARTUP] Server start() called successfully');

    } catch (error) {
        console.error('[STARTUP-ERROR] Error in main function:', error);
        logger.error('[STARTUP-ERROR] Error in main function', { 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        process.exit(1);
    }
}