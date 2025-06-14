// src/seeders/index.ts
import mongoose from 'mongoose';
import { seedOrderStatuses } from './order-status.seeder';
import { seedPaymentMethods } from './payment-method.seeder';
import logger from '../configs/logger';

async function runAllSeeders(): Promise<void> {
    try {
        logger.info('🌱 Iniciando proceso de seeding...');

        // Connect to MongoDB
        const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/store';
        await mongoose.connect(mongoUrl);
        logger.info('✅ Conectado a MongoDB');

        // Run seeders in order (OrderStatuses first because PaymentMethods reference them)
        await seedOrderStatuses();
        await seedPaymentMethods();

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
