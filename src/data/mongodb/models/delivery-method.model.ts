// src/data/mongodb/models/delivery-method.model.ts

import { Schema, model } from 'mongoose';

const deliveryMethodSchema = new Schema({
    // Código único para usar en la lógica interna (ej: 'SHIPPING', 'PICKUP')
    // Es importante que sea estable y no cambie.
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    // Nombre que verá el cliente (ej: 'Envío a Domicilio', 'Retiro en Local')
    name: {
        type: String,
        required: true,
        trim: true,
    },
    // Descripción opcional para dar más detalles en el frontend
    description: {
        type: String,
        trim: true,
    },
    // Flag para saber si este método requiere una dirección de envío.
    // Esta es la clave de la lógica.
    // 'Envío a Domicilio' -> true
    // 'Retiro en Local' -> false
    requiresAddress: {
        type: Boolean,
        required: true,
        default: true,
    },
    // Para poder activar o desactivar métodos sin borrarlos
    isActive: {
        type: Boolean,
        default: true,
        index: true, // Indexado para búsquedas rápidas
    },
}, {
    timestamps: true, // Agrega createdAt y updatedAt
    collection: 'deliverymethods' // Forzar el nombre de la colección
});

export const DeliveryMethodModel = model('DeliveryMethod', deliveryMethodSchema);
