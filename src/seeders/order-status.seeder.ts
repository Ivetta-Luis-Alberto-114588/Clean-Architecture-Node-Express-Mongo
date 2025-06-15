// src/seeders/order-status.seeder.ts
import mongoose from 'mongoose';
import { OrderStatusModel } from '../data/mongodb/models/order/order-status.model';
import logger from '../configs/logger';

interface OrderStatusSeed {
    code: string;
    name: string;
    description: string;
    color: string;
    order: number;
    isActive: boolean;
    isDefault: boolean;
    canTransitionTo: string[];
}

const orderStatusSeeds: OrderStatusSeed[] = [
    {
        code: 'PENDING',
        name: 'Pendiente',
        description: 'El pedido está pendiente de procesamiento',
        color: '#ffc107',
        order: 1,
        isActive: true,
        isDefault: true,
        canTransitionTo: ['CONFIRMED', 'AWAITING_PAYMENT', 'CANCELLED']
    },
    {
        code: 'CONFIRMED',
        name: 'Confirmado',
        description: 'El pedido ha sido confirmado pero no pagado',
        color: '#17a2b8',
        order: 2,
        isActive: true,
        isDefault: false,
        canTransitionTo: ['AWAITING_PAYMENT', 'COMPLETED', 'CANCELLED']
    },
    {
        code: 'AWAITING_PAYMENT',
        name: 'Esperando Pago',
        description: 'El pedido está esperando confirmación de pago',
        color: '#fd7e14',
        order: 3,
        isActive: true,
        isDefault: false,
        canTransitionTo: ['COMPLETED', 'CANCELLED']
    },
    {
        code: 'COMPLETED',
        name: 'Completado',
        description: 'El pedido ha sido pagado y completado',
        color: '#28a745',
        order: 4,
        isActive: true,
        isDefault: false,
        canTransitionTo: ['CANCELLED']
    },
    {
        code: 'CANCELLED',
        name: 'Cancelado',
        description: 'El pedido ha sido cancelado',
        color: '#dc3545',
        order: 5,
        isActive: true,
        isDefault: false,
        canTransitionTo: []
    }
];

export async function seedOrderStatuses(): Promise<void> {
    try {
        logger.info('Iniciando seed de estados de pedido...');        // Check if there are already order statuses
        const existingCount = await OrderStatusModel.countDocuments();
        if (existingCount > 0) {
            logger.info(`Ya existen ${existingCount} estados de pedido. Verificando estado por defecto...`);

            // Check if there's a default status
            const defaultStatus = await OrderStatusModel.findOne({ isDefault: true });
            if (!defaultStatus) {
                // Set PENDING as default if it exists, otherwise set the first one
                const pendingStatus = await OrderStatusModel.findOne({ code: 'PENDING' });
                if (pendingStatus) {
                    await OrderStatusModel.findByIdAndUpdate(pendingStatus._id, { isDefault: true });
                    logger.info(`✅ Estado 'PENDING' marcado como por defecto`);
                } else {
                    const firstStatus = await OrderStatusModel.findOne();
                    if (firstStatus) {
                        await OrderStatusModel.findByIdAndUpdate(firstStatus._id, { isDefault: true });
                        logger.info(`✅ Estado '${firstStatus.code}' marcado como por defecto`);
                    }
                }
            } else {
                logger.info(`✅ Estado por defecto ya configurado: ${defaultStatus.code}`);
            }
            return;
        }

        // First, create all statuses without canTransitionTo references
        const createdStatuses: any[] = [];
        for (const statusSeed of orderStatusSeeds) {
            const { canTransitionTo, ...statusData } = statusSeed;
            const status = await OrderStatusModel.create({
                ...statusData,
                canTransitionTo: [] // Empty initially
            });
            createdStatuses.push({ ...status.toObject(), originalCanTransitionTo: canTransitionTo });
            logger.info(`Estado '${status.code}' creado con ID: ${status._id}`);
        }

        // Now update the canTransitionTo references with actual ObjectIds
        for (const createdStatus of createdStatuses) {
            const transitionIds: mongoose.Types.ObjectId[] = [];

            for (const transitionCode of createdStatus.originalCanTransitionTo) {
                const targetStatus = createdStatuses.find(s => s.code === transitionCode);
                if (targetStatus) {
                    transitionIds.push(targetStatus._id);
                }
            }

            await OrderStatusModel.findByIdAndUpdate(
                createdStatus._id,
                { canTransitionTo: transitionIds }
            );

            logger.info(`Transiciones actualizadas para '${createdStatus.code}': ${createdStatus.originalCanTransitionTo.join(', ')}`);
        }

        logger.info(`✅ Seed de estados de pedido completado. ${createdStatuses.length} estados creados.`);

    } catch (error) {
        logger.error('❌ Error en seed de estados de pedido:', error);
        throw error;
    }
}

// Script execution when run directly
if (require.main === module) {
    mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/store')
        .then(async () => {
            logger.info('Conectado a MongoDB para seed de estados de pedido');
            await seedOrderStatuses();
            await mongoose.disconnect();
            logger.info('Desconectado de MongoDB');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Error conectando a MongoDB:', error);
            process.exit(1);
        });
}
