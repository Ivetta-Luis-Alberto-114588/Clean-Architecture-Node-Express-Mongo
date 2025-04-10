// src/data/mongodb/models/customers/customer.model.ts
import mongoose, { Schema } from "mongoose"; // Importar Schema

const customerSchema = new mongoose.Schema({
    // <<<--- NUEVO CAMPO --- >>>
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo User
        required: false, // No requerido para permitir invitados
        unique: true,    // Un usuario solo puede tener un perfil de cliente
        sparse: true,    // Permite múltiples documentos con valor null/undefined (para invitados)
        index: true,     // Indexar para búsquedas rápidas
    },
    // <<<--- FIN NUEVO CAMPO --- >>>
    name: {
        type: String,
        required: [true, "Customer name is required"],
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, "Customer email is required"],
        unique: true, // <<<--- Mantenemos unique para evitar duplicados de email (invitados o registrados)
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/, "Please enter a valid email address"],
        index: true, // Indexar email para búsquedas rápidas
    },
    phone: {
        type: String,
        required: [true, "Customer phone is required"], // Puede ser un placeholder inicial
        trim: true,
        match: [/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number"]
    },
    address: {
        type: String,
        required: [true, "Customer address is required"], // Puede ser un placeholder inicial
        trim: true
    },
    neighborhood: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Neighborhood",
        required: [true, "Neighborhood reference is required"] // Necesitará un default al crear desde User
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
}, {
    timestamps: true
});

// Índice compuesto para asegurar que la combinación userId/email sea única si userId existe
// Esto previene que un usuario tenga múltiples perfiles o que un invitado use el email de un usuario registrado
// customerSchema.index({ userId: 1, email: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });
// Nota: El índice unique en email ya cubre parte de esto. El índice compuesto es más estricto si permitieras
// cambiar el email del usuario/cliente. Por ahora, el unique en email es suficiente.

export const CustomerModel = mongoose.model("Customer", customerSchema);