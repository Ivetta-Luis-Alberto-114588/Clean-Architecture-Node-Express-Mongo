// src/data/mongodb/models/customers/address.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// Interfaz para el documento Address en Mongoose
export interface IAddress extends Document {
    _id: Types.ObjectId;
    customerId: Types.ObjectId; // Referencia al Cliente dueño de la dirección
    recipientName: string;      // Nombre de quien recibe (puede ser diferente al cliente)
    phone: string;
    streetAddress: string;      // Calle y número, piso, etc.
    postalCode?: string;        // Código postal (opcional pero recomendado)
    neighborhood: Types.ObjectId; // Referencia al Barrio
    city: Types.ObjectId;         // Referencia a la Ciudad (redundante si se popula desde barrio, pero útil)
    additionalInfo?: string;    // Instrucciones adicionales (ej: "dejar en portería")
    isDefault: boolean;         // Si es la dirección por defecto del cliente
    alias?: string;             // Alias opcional (ej: "Casa", "Trabajo")
    // timestamps (createdAt, updatedAt) añadidos automáticamente
}

const addressSchema = new Schema<IAddress>({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, "Customer ID is required"],
        index: true, // Indexar para buscar direcciones por cliente
    },
    recipientName: {
        type: String,
        required: [true, "Recipient name is required"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        match: [/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number"]
    },
    streetAddress: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
    },
    postalCode: {
        type: String,
        trim: true,
    },
    neighborhood: {
        type: Schema.Types.ObjectId,
        ref: 'Neighborhood',
        required: [true, "Neighborhood reference is required"]
    },
    city: {
        type: Schema.Types.ObjectId,
        ref: 'City',
        required: [true, "City reference is required"]
    },
    additionalInfo: {
        type: String,
        trim: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    alias: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true
});

// Índice compuesto para asegurar alias únicos por cliente (opcional)
// addressSchema.index({ customerId: 1, alias: 1 }, { unique: true, sparse: true });

export const AddressModel = mongoose.model<IAddress>("Address", addressSchema);