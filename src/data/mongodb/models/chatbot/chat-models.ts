// src/data/mongodb/models/chatbot/chat-models.ts
import mongoose from "mongoose";

// Esquema para los mensajes de chat
const chatMessageSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatSession",
        required: [true, "Session ID is required"]
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: [true, "Role is required"]
    },
    content: {
        type: String,
        required: [true, "Content is required"]
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Esquema para las sesiones de chat
const chatSessionSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum: ['customer', 'owner'],
        required: [true, "User type is required"],
        default: 'customer'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Esquema para almacenar embeddings de productos, ventas, etc.
// Esquema para almacenar embeddings de productos, ventas, etc.
const embeddingSchema = new mongoose.Schema({
    objectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Object ID is required"]
    },
    collectionName: {
        type: String,
        required: [true, "Collection name is required"],
        enum: ['Product', 'Sale', 'Category', 'Customer', 'City', 'Neighborhood', 'Unit', 'Payment'] // Actualizado para incluir los nuevos modelos
    },
    embedding: {
        type: [Number], // Vector de embedding
        required: [true, "Embedding is required"]
    },
    text: {
        type: String,
        required: [true, "Text representation is required"]
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Crear índice para búsqueda eficiente
embeddingSchema.index({ collectionName: 1 });

// Exportar modelos
export const ChatMessageModel = mongoose.model("ChatMessage", chatMessageSchema);
export const ChatSessionModel = mongoose.model("ChatSession", chatSessionSchema);
export const EmbeddingModel = mongoose.model("Embedding", embeddingSchema);