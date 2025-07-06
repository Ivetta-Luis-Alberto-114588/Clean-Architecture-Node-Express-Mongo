// src/seeders/index.ts
import mongoose from 'mongoose';
import { seedOrderStatuses } from './order-status.seeder';
import { seedPaymentMethods } from './payment-method.seeder';
import { seedDeliveryMethods } from './delivery-methods.seeder';
import logger from '../configs/logger';
import { envs } from '../configs/envs';

async function runAllSeeders(): Promise<void> {
    try {
        logger.info('🌱 Iniciando proceso de seeding...');

        // Connect to MongoDB using the same configuration as the app
        await mongoose.connect(envs.MONGO_URL, {
            dbName: envs.MONGO_DB_NAME,
        });
        logger.info('✅ Conectado a MongoDB', {
            dbName: envs.MONGO_DB_NAME,
            connectionName: mongoose.connection.name
        });

        // Run seeders in order (OrderStatuses first because PaymentMethods reference them)
        await seedOrderStatuses();
        await seedPaymentMethods();
        await seedDeliveryMethods();

        logger.info('🎉 Todos los seeders completados exitosamente');

    } catch (error) {
        logger.error('❌ Error ejecutando seeders:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        logger.info('Desconectado de MongoDB');
    }
}

// Script execution when run directly
if (require.main === module) {
    runAllSeeders()
        .then(() => {
            logger.info('Proceso de seeding terminado');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Error en proceso de seeding:', error);
            process.exit(1);
        });
}

export { runAllSeeders, seedOrderStatuses };
