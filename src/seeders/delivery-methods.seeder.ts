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
                code: 'PICKUP',
                name: 'Retiro en Local',
                description: 'Acércate a nuestra tienda a retirar tu pedido.',
                requiresAddress: false,
                isActive: true,
            },
            {
                code: 'DELIVERY',
                name: 'Entrega a Domicilio',
                description: 'Recibe tu pedido en la puerta de tu casa.',
                requiresAddress: true,
                isActive: true,
            },
            {
                code: 'EXPRESS',
                name: 'Entrega Express',
                description: 'Entrega el mismo día (servicio premium).',
                requiresAddress: true,
                isActive: true,
            },
        ];

        // Insertar los nuevos métodos usando upsert para evitar duplicados
        const createdMethods = [];
        for (const method of methods) {
            try {
                // Usar findOneAndUpdate con upsert para evitar duplicados
                const created = await DeliveryMethodModel.findOneAndUpdate(
                    { code: method.code }, // Buscar por código
                    method, // Datos a actualizar/insertar
                    {
                        upsert: true, // Crear si no existe
                        new: true, // Retornar el documento actualizado
                        runValidators: true // Ejecutar validaciones
                    }
                );
                createdMethods.push(created);
                console.log(`✅ Upserted delivery method: ${method.name} (${method.code}) - ID: ${created._id}`);
            } catch (error) {
                console.error(`❌ Error upserting method ${method.code}:`, error);
                throw error;
            }
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
