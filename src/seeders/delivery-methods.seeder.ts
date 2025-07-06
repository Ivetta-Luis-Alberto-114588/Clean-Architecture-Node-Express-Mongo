// src/seeders/delivery-methods.seeder.ts

import mongoose from 'mongoose';
import { DeliveryMethodModel } from '../data/mongodb/models/delivery-method.model';

export const seedDeliveryMethods = async () => {
    console.log('🚀 Starting delivery methods seeding...');
    console.log('🔍 Using database:', mongoose.connection.name);
    console.log('🔍 Connection state:', mongoose.connection.readyState);

    try {
        // Verificar conexión antes de proceder
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB no está conectado');
        }

        // Verificar cuántos documentos existen antes de limpiar
        const countBefore = await DeliveryMethodModel.countDocuments();
        console.log(`📊 Documents before cleanup: ${countBefore}`);

        // Limpiar la colección primero
        const deleteResult = await DeliveryMethodModel.deleteMany({});
        console.log('🧹 Cleared existing delivery methods:', deleteResult);

        const methods = [
            {
                code: 'SHIPPING',
                name: 'Envío a Domicilio',
                description: 'Recibe tu pedido en la puerta de tu casa.',
                requiresAddress: true,
                isActive: true,
            },
            {
                code: 'PICKUP',
                name: 'Retiro en Local',
                description: 'Acércate a nuestra tienda a retirar tu pedido.',
                requiresAddress: false,
                isActive: true,
            },
        ];

        // Insertar los nuevos métodos
        const createdMethods = [];
        for (const method of methods) {
            const created = await DeliveryMethodModel.create(method);
            createdMethods.push(created);
            console.log(`✅ Created delivery method: ${method.name} (${method.code}) - ID: ${created._id}`);
        }

        // Verificar que se insertaron correctamente
        const countAfter = await DeliveryMethodModel.countDocuments();
        console.log(`📊 Documents after seeding: ${countAfter}`);

        // Verificar con find
        const allMethods = await DeliveryMethodModel.find({});
        console.log('📋 All delivery methods in database:', allMethods.map(m => ({ id: m._id, code: m.code, name: m.name })));

        console.log('✅ Delivery methods seeded successfully.');

    } catch (error) {
        console.error('❌ Error seeding delivery methods:', error);
        throw error;
    }
};
