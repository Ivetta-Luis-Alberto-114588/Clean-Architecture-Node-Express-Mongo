// src/seeders/payment-method.seeder.ts
import mongoose from 'mongoose';
import { PaymentMethodModel } from '../data/mongodb/models/payment/payment-method.model';
import { OrderStatusModel } from '../data/mongodb/models/order/order-status.model';
import logger from '../configs/logger';

interface PaymentMethodSeed {
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    requiresOnlinePayment: boolean;
    allowsManualConfirmation: boolean;
    defaultOrderStatusCode: string; // We'll resolve this to ObjectId
}

const paymentMethodSeeds: PaymentMethodSeed[] = [
    {
        code: 'CASH',
        name: 'Efectivo',
        description: 'Pago en efectivo al momento de la entrega o retiro en el local.',
        isActive: true,
        requiresOnlinePayment: false,
        allowsManualConfirmation: true,
        defaultOrderStatusCode: 'AWAITING_PAYMENT' // Inicia esperando confirmación manual del dueño.
    },
    {
        code: 'MERCADO_PAGO',
        name: 'Mercado Pago',
        description: 'Pago online con tarjeta de crédito, débito o dinero en cuenta.',
        isActive: true,
        requiresOnlinePayment: true,
        allowsManualConfirmation: false,
        defaultOrderStatusCode: 'AWAITING_PAYMENT' // Inicia esperando la confirmación automática del webhook.
    }
];

export async function seedPaymentMethods(): Promise<void> {
    try {
        logger.info('Iniciando seed de métodos de pago...');

        // Check if there are already payment methods
        const existingCount = await PaymentMethodModel.countDocuments();
        if (existingCount > 0) {
            logger.info(`Ya existen ${existingCount} métodos de pago. Saltando seed.`);
            return;
        }

        // Get all order statuses to resolve references
        const orderStatuses = await OrderStatusModel.find({}).lean();
        const statusCodeToId = new Map<string, mongoose.Types.ObjectId>();

        for (const status of orderStatuses) {
            statusCodeToId.set(status.code, status._id);
        }

        // Create payment methods
        const createdMethods: any[] = [];

        for (const methodSeed of paymentMethodSeeds) {
            const { defaultOrderStatusCode, ...methodData } = methodSeed;

            // Resolve order status code to ObjectId
            const defaultOrderStatusId = statusCodeToId.get(defaultOrderStatusCode);
            if (!defaultOrderStatusId) {
                logger.warn(`Estado de orden '${defaultOrderStatusCode}' no encontrado para método '${methodSeed.code}'. Saltando...`);
                continue;
            }

            const method = await PaymentMethodModel.create({
                ...methodData,
                defaultOrderStatusId
            });

            createdMethods.push(method);
            logger.info(`Método de pago '${method.code}' creado con ID: ${method._id}`);
        }

        logger.info(`✅ Seed de métodos de pago completado. ${createdMethods.length} métodos creados.`);

    } catch (error) {
        logger.error('❌ Error en seed de métodos de pago:', error);
        throw error;
    }
}

// Script execution when run directly
if (require.main === module) {
    mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/store')
        .then(async () => {
            logger.info('Conectado a MongoDB para seed de métodos de pago');
            await seedPaymentMethods();
            await mongoose.disconnect();
            logger.info('Desconectado de MongoDB');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Error conectando a MongoDB:', error);
            process.exit(1);
        });
}
